"""Convert HTML strings to TipTap JSON format using Python's built-in HTMLParser."""
from __future__ import annotations

from html.parser import HTMLParser
from typing import Any


_EMPTY_PARA: dict[str, Any] = {"type": "paragraph", "content": [{"type": "text", "text": ""}]}


class _Converter(HTMLParser):
    """Stateful HTML → TipTap JSON converter."""

    def __init__(self) -> None:
        super().__init__()
        self.doc: list[dict[str, Any]] = []
        self._inline: list[dict[str, Any]] = []
        self._marks: list[dict[str, Any]] = []
        self._list_stack: list[dict[str, Any]] = []
        self._block_attrs: dict[str, Any] | None = None

    # -- helpers --
    def _text_node(self, text: str) -> dict[str, Any]:
        node: dict[str, Any] = {"type": "text", "text": text}
        if self._marks:
            node["marks"] = list(self._marks)
        return node

    def _flush_inline(self) -> list[dict[str, Any]]:
        nodes = self._inline if self._inline else [{"type": "text", "text": ""}]
        self._inline = []
        return nodes

    def _parse_align(self, attrs: list[tuple[str, str | None]]) -> str | None:
        for k, v in attrs:
            if k == "style" and v and "text-align" in v:
                for part in v.split(";"):
                    part = part.strip()
                    if part.startswith("text-align:"):
                        return part.split(":", 1)[1].strip()
        return None

    # -- block start --
    def _start_block(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        align = self._parse_align(attrs)
        self._block_attrs = {"textAlign": align} if align else None
        self._inline = []

    # -- handlers --
    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        a = dict(attrs)

        # Block elements
        if tag == "p":
            self._start_block(tag, attrs)
        elif tag in ("h1", "h2", "h3"):
            self._start_block(tag, attrs)
        elif tag == "blockquote":
            self._start_block(tag, attrs)
        elif tag == "ul":
            self._list_stack.append({"type": "bulletList", "content": []})
        elif tag == "ol":
            self._list_stack.append({"type": "orderedList", "content": []})
        elif tag == "li":
            self._inline = []

        # Inline formatting (marks)
        elif tag in ("strong", "b"):
            self._marks.append({"type": "bold"})
        elif tag in ("em", "i"):
            self._marks.append({"type": "italic"})
        elif tag == "u":
            self._marks.append({"type": "underline"})
        elif tag in ("s", "strike", "del"):
            self._marks.append({"type": "strike"})
        elif tag == "code":
            self._marks.append({"type": "code"})
        elif tag == "a":
            href = a.get("href", "")
            self._marks.append({"type": "link", "attrs": {"href": href, "target": "_blank"}})

        # Void elements
        elif tag == "br":
            self._inline.append({"type": "hardBreak"})
        elif tag == "hr":
            self.doc.append({"type": "horizontalRule"})
        elif tag == "img":
            self._inline.append({
                "type": "image",
                "attrs": {"src": a.get("src", ""), "alt": a.get("alt", "")},
            })

    def handle_endtag(self, tag: str) -> None:
        # Block elements — flush to doc
        if tag == "p":
            para: dict[str, Any] = {"type": "paragraph", "content": self._flush_inline()}
            if self._block_attrs:
                para["attrs"] = self._block_attrs
                self._block_attrs = None
            self.doc.append(para)
        elif tag in ("h1", "h2", "h3"):
            level = int(tag[1])
            heading: dict[str, Any] = {
                "type": "heading",
                "attrs": {"level": level},
                "content": self._flush_inline(),
            }
            if self._block_attrs:
                heading["attrs"]["textAlign"] = self._block_attrs["textAlign"]
                self._block_attrs = None
            self.doc.append(heading)
        elif tag == "blockquote":
            bq: dict[str, Any] = {"type": "blockquote", "content": self._flush_inline()}
            self.doc.append(bq)

        # List items
        elif tag == "li":
            content = self._inline if self._inline else [{"type": "text", "text": ""}]
            item = {"type": "listItem", "content": [{"type": "paragraph", "content": content}]}
            if self._list_stack:
                self._list_stack[-1]["content"].append(item)
            self._inline = []
        elif tag in ("ul", "ol"):
            if self._list_stack:
                node = self._list_stack.pop()
                if self._list_stack:
                    # nested list — append to parent list item's content
                    parent_items = self._list_stack[-1]["content"]
                    if parent_items:
                        parent_items[-1]["content"].append(node)
                else:
                    self.doc.append(node)

        # Inline marks
        elif tag in ("strong", "b", "em", "i", "u", "s", "strike", "del", "code"):
            if self._marks:
                self._marks.pop()
        elif tag == "a":
            if self._marks:
                self._marks.pop()

    def handle_data(self, data: str) -> None:
        if not data:
            return
        self._inline.append(self._text_node(data))

    def result(self) -> dict[str, Any]:
        # Flush any remaining inline content (e.g. plain text with no HTML tags)
        if self._inline:
            self.doc.append({"type": "paragraph", "content": self._flush_inline()})
        content = self.doc if self.doc else [_EMPTY_PARA]
        return {"type": "doc", "content": content}


def html_to_tiptap(content: str | dict | None) -> dict[str, Any]:
    """Convert content to a TipTap JSON object.

    Accepts HTML strings (converted), TipTap JSON dicts (pass-through), or None.
    """
    if content is None:
        return {"type": "doc", "content": [_EMPTY_PARA.copy()]}
    if isinstance(content, dict):
        return content
    if not content or not content.strip():
        return {"type": "doc", "content": [_EMPTY_PARA.copy()]}
    conv = _Converter()
    conv.feed(content)
    return conv.result()
