#!/usr/bin/env python3
"""Continue seeding from step 10: criteria, import ideas, score."""
import asyncio
import httpx
import random
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE = "http://localhost:8000/api/v1"
ADMIN_USER = "admin"
ADMIN_PASS = "abc13579"

TEAM_LEADERS = ["alpha_ld", "beta_ld", "gamma_ld", "delta_ld"]
TEAM_NAMES = ["Alpha Innovators", "Beta Builders", "Gamma Geniuses", "Delta Disruptors"]

# Ideas to import: (leader_username, room_index_in_original_10, idea_title)
IDEAS_MAP = {
    "Alpha Innovators": [
        "Adaptive Frame Sampling for AI Camera",
        "NPU-Aware Task Scheduling",
        "Quantized LLM with Progressive Loading",
    ],
    "Beta Builders": [
        "Federated Sensor Data Processing",
        "User-Defined Permission Sandbox",
    ],
    "Gamma Geniuses": [
        "Hybrid Cloud-Edge Agent Framework",
        "Compressed Action Graph for Offline Agents",
    ],
    "Delta Disruptors": [
        "Transparent Action Confirmation System",
        "Universal Agent API Layer",
    ],
}


async def api(client, method, path, token=None, **kwargs):
    headers = kwargs.pop("headers", {})
    if token:
        headers["Authorization"] = f"Bearer {token}"
    resp = await getattr(client, method)(f"{BASE}{path}", headers=headers, **kwargs)
    if resp.status_code >= 400:
        print(f"  ERROR {resp.status_code} {method} {path}: {resp.text[:300]}")
    resp.raise_for_status()
    return resp.json()


async def login(client, username, password="Pass@1234"):
    r = await api(client, "post", "/auth/login", json={"username": username, "password": password})
    return r["access_token"], r["user"]


async def main():
    async with httpx.AsyncClient(timeout=30) as c:
        admin_token, _ = await login(c, ADMIN_USER, ADMIN_PASS)

        # Find event
        events = await api(c, "get", "/events?limit=10", admin_token)
        event = next((e for e in events["items"] if "Agentic AI" in e["title"]), None)
        if not event:
            print("Event not found!"); return
        event_id = event["id"]
        print(f"Event: {event['title']} id={event_id[:8]}...")

        # Get teams
        teams_resp = await api(c, "get", f"/events/{event_id}/teams?limit=10", admin_token)
        teams = {t["name"]: t for t in teams_resp["items"]}
        print(f"Teams: {list(teams.keys())}")

        # Step 10: Init criteria
        print("\n=== Initializing scoring criteria ===")
        criteria = await api(c, "get", f"/events/{event_id}/criteria", admin_token)
        max_scores = {cr["id"]: cr["max_score"] for cr in criteria}
        print(f"  Criteria: {[cr['name'] for cr in criteria]} (max_scores: {list(max_scores.values())})")

        # Step 11: Import ideas from rooms
        # First, get all rooms and ideas
        print("\n=== Importing ideas to event ===")

        # Get all rooms (admin can see all)
        all_rooms_resp = await api(c, "get", "/rooms?limit=50", admin_token)
        all_rooms = all_rooms_resp["items"]

        # Get all ideas (admin can see all)
        all_ideas_resp = await api(c, "get", "/ideas?limit=50", admin_token)
        all_ideas_list = all_ideas_resp["items"]

        # Check existing event ideas
        existing_ideas_resp = await api(c, "get", f"/events/{event_id}/ideas?limit=50", admin_token)
        existing_titles = {i["title"] for i in existing_ideas_resp["items"]}

        event_idea_ids = {tname: [] for tname in TEAM_NAMES}

        # Map idea titles to (room_id, idea_id)
        idea_room_map = {}
        for idea in all_ideas_list:
            idea_room_map[idea["title"]] = (idea["room_id"], idea["id"])

        imported_any = False
        for i, tname in enumerate(TEAM_NAMES):
            leader = TEAM_LEADERS[i]
            token, user = await login(c, leader)

            for title in IDEAS_MAP[tname]:
                if title in existing_titles:
                    # Find the existing event idea
                    for ei in existing_ideas_resp["items"]:
                        if ei["title"] == title:
                            event_idea_ids[tname].append(ei["id"])
                    continue

                if title not in idea_room_map:
                    print(f"  Idea not found: {title}")
                    continue

                room_id, idea_id = idea_room_map[title]
                r = await api(c, "post", f"/events/{event_id}/ideas/from-room", token,
                              json={"room_id": room_id, "idea_id": idea_id})
                event_idea_ids[tname].append(r["id"])
                imported_any = True
                print(f"  Imported: {title[:40]}... → {tname}")

        if not imported_any:
            print("  All ideas already imported")

        # Step 12: Scoring (round-robin: each team scores the NEXT team's ideas)
        print("\n=== Round-robin scoring ===")
        for i, scorer_name in enumerate(TEAM_NAMES):
            target_name = TEAM_NAMES[(i + 1) % len(TEAM_NAMES)]
            leader = TEAM_LEADERS[i]
            token, _ = await login(c, leader)

            for idea_id in event_idea_ids[target_name]:
                cscores = {}
                cnotes = {}
                for cid, max_s in max_scores.items():
                    # Valid scores are multiples of max_score/5
                    step = max_s / 5
                    level = random.randint(3, 5)  # 60-100% of max
                    cscores[cid] = round(step * level, 1)
                    cnotes[cid] = random.choice([
                        "Good approach with solid technical foundation.",
                        "Innovative but needs more feasibility analysis.",
                        "Strong potential impact on mobile AI.",
                        "Well-thought-out solution.",
                        "Creative idea, implementation could be challenging.",
                    ])

                r = await api(c, "post", f"/events/{event_id}/ideas/{idea_id}/scores", token,
                              json={"criteria_scores": cscores, "criteria_notes": cnotes})
                print(f"  {scorer_name} scored {target_name}: {r['total_score']:.1f}")

        print(f"\n=== DONE! Total ideas: {sum(len(v) for v in event_idea_ids.values())} ===")


if __name__ == "__main__":
    asyncio.run(main())
