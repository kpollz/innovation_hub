#!/usr/bin/env python3
"""Seed demo data: 12 users, 10 problems, 10 rooms, 1 event, 4 teams, ideas, scores."""
import asyncio
import httpx
import random
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE = "http://localhost:8000/api/v1"
ADMIN_USER = "admin"
ADMIN_PASS = "abc13579"

# ── helpers ──────────────────────────────────────────────────────────────────

async def api(client: httpx.AsyncClient, method: str, path: str, token: str | None = None, **kwargs):
    headers = kwargs.pop("headers", {})
    if token:
        headers["Authorization"] = f"Bearer {token}"
    resp = await getattr(client, method)(f"{BASE}{path}", headers=headers, **kwargs)
    if resp.status_code >= 400:
        print(f"  ERROR {resp.status_code} {method} {path}: {resp.text[:200]}")
    resp.raise_for_status()
    return resp.json()


async def register(client: httpx.AsyncClient, username: str, full_name: str, team: str):
    r = await api(client, "post", "/auth/register", json={
        "username": username,
        "password": "Pass@1234",
        "email": f"{username}@demo.com",
        "full_name": full_name,
        "team": team,
    })
    print(f"  Created user: {username} ({full_name}) id={r['user']['id']}")
    return r


async def login(client: httpx.AsyncClient, username: str, password: str):
    r = await api(client, "post", "/auth/login", json={
        "username": username, "password": password,
    })
    return r["access_token"], r["user"]


def tiptap(text: str):
    return {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": text}]}]}


# ── main seed ────────────────────────────────────────────────────────────────

async def seed():
    async with httpx.AsyncClient(timeout=30) as c:
        # 1. Admin login
        print("=== Logging in as admin ===")
        admin_token, admin_user = await login(c, ADMIN_USER, ADMIN_PASS)

        # 2. Create 12 users (4 teams × 3)
        print("\n=== Creating 12 users ===")
        teams_config = [
            {"name": "Alpha Innovators", "members": [
                ("alpha_ld", "Nguyen Van An", "Alpha"),
                ("alpha_m1", "Tran Thi Bich", "Alpha"),
                ("alpha_m2", "Le Hoang Cuong", "Alpha"),
            ]},
            {"name": "Beta Builders", "members": [
                ("beta_ld", "Pham Minh Duc", "Beta"),
                ("beta_m1", "Hoang Thi Ha", "Beta"),
                ("beta_m2", "Vu Quoc Phuong", "Beta"),
            ]},
            {"name": "Gamma Geniuses", "members": [
                ("gamma_ld", "Bui Thanh Giang", "Gamma"),
                ("gamma_m1", "Do Thi Huong", "Gamma"),
                ("gamma_m2", "Ngo Van Khoa", "Gamma"),
            ]},
            {"name": "Delta Disruptors", "members": [
                ("delta_ld", "Ly Thuy Linh", "Delta"),
                ("delta_m1", "Cao Van Manh", "Delta"),
                ("delta_m2", "Dinh Thi Ngoc", "Delta"),
            ]},
        ]

        user_tokens = {}  # username -> token
        user_ids = {}     # username -> id
        team_user_ids = {} # team_name -> [user_ids]

        for tc in teams_config:
            tname = tc["name"]
            team_user_ids[tname] = []
            for uname, fname, team in tc["members"]:
                try:
                    r = await register(c, uname, fname, team)
                    uid = r["user"]["id"]
                except httpx.HTTPStatusError:
                    # User might already exist, login instead
                    tok, u = await login(c, uname, "Pass@1234")
                    uid = u["id"]
                    r = {"access_token": tok, "user": u}
                user_ids[uname] = uid
                user_tokens[uname] = r["access_token"]
                team_user_ids[tname].append(uid)

        # 3. Create 10 problems (each team creates 2-3 private problems)
        print("\n=== Creating 10 problems ===")
        problems_data = [
            # Team Alpha (3 problems)
            ("alpha_ld", "Battery Drain in AI-Powered Camera Apps",
             "AI-powered camera features cause 40% faster battery drain on mobile devices.",
             "technical", {"name": "Alpha Innovators"}),
            ("alpha_ld", "On-Device LLM Latency on Mid-Range Phones",
             "Running LLMs on devices with <6GB RAM causes unacceptable response times.",
             "technical", {"name": "Alpha Innovators"}),
            ("alpha_m1", "Context Loss in Multi-Turn Mobile AI Conversations",
             "Mobile AI assistants lose conversation context when switching between apps.",
             "process", {"name": "Alpha Innovators"}),
            # Team Beta (2 problems)
            ("beta_ld", "Privacy Risks of Agentic AI Accessing Phone Sensors",
             "Autonomous AI agents need camera/mic/GPS access, raising privacy concerns.",
             "people", {"name": "Beta Builders"}),
            ("beta_m1", "AI Agent Decision Transparency on Mobile",
             "Users don't understand why AI agents make certain decisions on their phones.",
             "tools", {"name": "Beta Builders"}),
            # Team Gamma (2 problems)
            ("gamma_ld", "Offline-First Agentic AI Architecture",
             "Mobile AI agents fail completely without internet connectivity.",
             "technical", {"name": "Gamma Geniuses"}),
            ("gamma_m1", "Mobile Data Usage by Background AI Agents",
             "Autonomous AI agents consume excessive mobile data without user awareness.",
             "tools", {"name": "Gamma Geniuses"}),
            # Team Delta (2 problems)
            ("delta_ld", "User Trust in Autonomous Mobile AI Actions",
             "Users are reluctant to let AI agents perform actions (send messages, book appointments) autonomously.",
             "people", {"name": "Delta Disruptors"}),
            ("delta_m1", "Cross-App AI Agent Integration Barriers",
             "AI agents cannot seamlessly operate across different mobile apps due to API restrictions.",
             "tools", {"name": "Delta Disruptors"}),
            # Admin creates 1 public problem
            (None, "Agentic AI in Mobile: Opportunity or Threat?",
             "How should we balance innovation in autonomous mobile AI with user safety and privacy?",
             "process", None),
        ]

        problem_ids = []
        for creator, title, summary, category, team_info in problems_data:
            if creator:
                token = user_tokens[creator]
                shared = team_user_ids[team_info["name"]] if team_info else []
            else:
                token = admin_token
                shared = []

            r = await api(c, "post", "/problems", token, json={
                "title": title,
                "summary": summary,
                "content": tiptap(f"{summary}\n\nThis is a detailed description of the problem: {title}. We need innovative solutions to address this challenge in the context of Agentic AI in Mobile devices."),
                "category": category,
                "visibility": "private" if team_info else "public",
                "shared_user_ids": shared,
            })
            problem_ids.append(r["id"])
            print(f"  Problem: {title} ({'private' if team_info else 'public'}) id={r['id'][:8]}...")

        # 4. Create 10 rooms linked to problems
        print("\n=== Creating 10 rooms ===")
        rooms_data = [
            # Team Alpha rooms
            ("alpha_ld", "Battery Optimization for AI Camera", 0, {"name": "Alpha Innovators"}),
            ("alpha_m1", "On-Device LLM Optimization", 1, {"name": "Alpha Innovators"}),
            ("alpha_m2", "Context Preservation Strategies", 2, {"name": "Alpha Innovators"}),
            # Team Beta rooms
            ("beta_ld", "Privacy-First Agent Architecture", 3, {"name": "Beta Builders"}),
            ("beta_m2", "Explainable AI for Mobile Agents", 4, {"name": "Beta Builders"}),
            # Team Gamma rooms
            ("gamma_ld", "Offline AI Agent Framework", 5, {"name": "Gamma Geniuses"}),
            ("gamma_m2", "Data-Efficient Agent Design", 6, {"name": "Gamma Geniuses"}),
            # Team Delta rooms
            ("delta_ld", "Trust Building for Mobile AI", 7, {"name": "Delta Disruptors"}),
            ("delta_m1", "Cross-App Agent Protocol", 8, {"name": "Delta Disruptors"}),
            # Admin public room
            (None, "General: AI Safety Discussion", 9, None),
        ]

        room_ids = []
        for creator, rname, pidx, team_info in rooms_data:
            if creator:
                token = user_tokens[creator]
                shared = team_user_ids[team_info["name"]] if team_info else []
            else:
                token = admin_token
                shared = []

            r = await api(c, "post", "/rooms", token, json={
                "name": rname,
                "description": f"Brainstorming room for: {rname}",
                "problem_id": problem_ids[pidx],
                "visibility": "private" if team_info else "public",
                "shared_user_ids": shared,
            })
            room_ids.append(r["id"])
            print(f"  Room: {rname} id={r['id'][:8]}...")

        # 5. Create ideas in rooms (for later import to event)
        print("\n=== Creating ideas in rooms ===")
        ideas_in_rooms = []  # (room_id, idea_id)
        idea_data = [
            # Room 0: Battery Optimization
            ("alpha_m1", 0, "Adaptive Frame Sampling for AI Camera",
             "Dynamically reduce AI processing frames when battery is below 20%, extending battery life by 30%."),
            ("alpha_m2", 0, "NPU-Aware Task Scheduling",
             "Route AI camera workloads through NPU instead of GPU when available, reducing power consumption by 40%."),
            # Room 1: On-Device LLM
            ("alpha_m2", 1, "Quantized LLM with Progressive Loading",
             "Use 4-bit quantization with progressive model loading to fit LLMs in 4GB RAM."),
            # Room 3: Privacy-First Agent
            ("beta_m1", 3, "Federated Sensor Data Processing",
             "Process sensitive sensor data on-device using federated learning, only sending anonymized insights to the cloud."),
            ("beta_m2", 3, "User-Defined Permission Sandbox",
             "Allow users to define granular time-based permissions for AI agent sensor access."),
            # Room 5: Offline AI Agent
            ("gamma_m1", 5, "Hybrid Cloud-Edge Agent Framework",
             "Cache common agent actions offline, sync with cloud when connectivity returns."),
            ("gamma_m2", 5, "Compressed Action Graph for Offline Agents",
             "Pre-download compressed decision trees for common agent tasks, enabling full offline operation."),
            # Room 7: Trust Building
            ("delta_m2", 7, "Transparent Action Confirmation System",
             "Show users a preview of AI agent actions before execution, with undo capability."),
            # Room 8: Cross-App Agent
            ("delta_m1", 8, "Universal Agent API Layer",
             "Create a middleware layer that standardizes AI agent interactions across different mobile apps."),
        ]

        for creator, ridx, title, desc in idea_data:
            token = user_tokens[creator]
            r = await api(c, "post", "/ideas", token, json={
                "room_id": room_ids[ridx],
                "title": title,
                "description": tiptap(f"{desc}\n\n## Key Benefits\n- Improved user experience\n- Better performance on mobile devices\n- Enhanced privacy and security\n\n## Implementation Approach\nThis solution leverages modern mobile hardware capabilities and AI optimization techniques."),
                "summary": desc,
            })
            ideas_in_rooms.append((room_ids[ridx], r["id"]))
            print(f"  Idea: {title} in room {ridx} id={r['id'][:8]}...")

        # 6. Create Event
        print("\n=== Creating Event ===")
        ev = await api(c, "post", "/events", admin_token, json={
            "title": "Agentic AI in Mobile Innovation Challenge",
            "description": tiptap(
                "## Welcome to the Agentic AI in Mobile Innovation Challenge!\n\n"
                "This event focuses on solving key challenges in deploying autonomous AI agents on mobile devices.\n\n"
                "### Themes\n"
                "- **Performance**: Optimizing AI agents for mobile hardware\n"
                "- **Privacy**: Protecting user data while enabling intelligent agents\n"
                "- **Trust**: Building user confidence in autonomous AI actions\n"
                "- **Connectivity**: Ensuring AI agents work in all network conditions\n\n"
                "### Scoring\n"
                "Each team will score other teams' ideas based on Innovation, Feasibility, and Impact."
            ),
            "introduction_type": "editor",
            "status": "active",
        })
        event_id = ev["id"]
        print(f"  Event: {ev['title']} id={event_id[:8]}...")

        # 7. Create 4 teams
        print("\n=== Creating 4 event teams ===")
        team_ids = {}  # team_name -> team_id
        for tc in teams_config:
            leader_uname = tc["members"][0][0]
            token = user_tokens[leader_uname]
            r = await api(c, "post", f"/events/{event_id}/teams", token, json={
                "name": tc["name"],
                "slogan": f"Innovation driven by {tc['name']}",
            })
            team_ids[tc["name"]] = r["id"]
            print(f"  Team: {tc['name']} led by {leader_uname} id={r['id'][:8]}...")

        # 8. Members join teams + leader approves
        print("\n=== Adding members to teams ===")
        for tc in teams_config:
            tname = tc["name"]
            tid = team_ids[tname]
            leader_uname = tc["members"][0][0]
            leader_token = user_tokens[leader_uname]

            for uname, _, _ in tc["members"][1:]:  # Skip leader (already member)
                member_token = user_tokens[uname]
                uid = user_ids[uname]

                # Join
                await api(c, "post", f"/events/{event_id}/teams/{tid}/join", member_token)
                # Approve
                await api(c, "patch", f"/events/{event_id}/teams/{tid}/members/{uid}", leader_token,
                          json={"status": "active"})
                print(f"  {uname} joined {tname}")

        # 9. Assign reviews (round-robin: A→B, B→C, C→D, D→A)
        print("\n=== Assigning reviews (round-robin) ===")
        team_names = [tc["name"] for tc in teams_config]
        for i, tname in enumerate(team_names):
            target_name = team_names[(i + 1) % len(team_names)]
            tid = team_ids[tname]
            target_id = team_ids[target_name]
            await api(c, "patch", f"/events/{event_id}/teams/{tid}/assign-review", admin_token,
                      json={"target_team_id": target_id})
            print(f"  {tname} reviews {target_name}")

        # 10. Initialize scoring criteria (GET auto-seeds defaults)
        print("\n=== Initializing scoring criteria ===")
        criteria = await api(c, "get", f"/events/{event_id}/criteria", admin_token)
        criteria_ids = {cr["name"]: cr["id"] for cr in criteria}
        print(f"  Criteria: {list(criteria_ids.keys())}")

        # 11. Import ideas from rooms into event
        print("\n=== Importing ideas to event ===")
        # Map ideas to teams
        team_ideas = {
            "Alpha Innovators": ideas_in_rooms[0:3],   # 3 ideas
            "Beta Builders": ideas_in_rooms[3:5],       # 2 ideas
            "Gamma Geniuses": ideas_in_rooms[5:7],      # 2 ideas
            "Delta Disruptors": ideas_in_rooms[7:9],    # 2 ideas
        }

        event_idea_ids = {}  # team_name -> [idea_ids]
        for tname, ideas in team_ideas.items():
            leader_uname = [tc["members"][0][0] for tc in teams_config if tc["name"] == tname][0]
            token = user_tokens[leader_uname]
            event_idea_ids[tname] = []

            for room_id, idea_id in ideas:
                r = await api(c, "post", f"/events/{event_id}/ideas/from-room", token,
                              json={"room_id": room_id, "idea_id": idea_id})
                event_idea_ids[tname].append(r["id"])
                print(f"  Imported idea to {tname}: {r['title'][:40]}... id={r['id'][:8]}...")

        # 12. Round-robin scoring
        print("\n=== Scoring (round-robin) ===")
        max_scores = {cr["id"]: cr["max_score"] for cr in criteria}

        for i, scorer_name in enumerate(team_names):
            target_name = team_names[(i + 1) % len(team_names)]
            scorer_leader = [tc["members"][0][0] for tc in teams_config if tc["name"] == scorer_name][0]
            token = user_tokens[scorer_leader]

            for idea_id in event_idea_ids[target_name]:
                # Random scores for each criteria (70-100% of max)
                cscores = {}
                cnotes = {}
                for cid, max_s in max_scores.items():
                    score_val = round(random.uniform(max_s * 0.7, max_s), 1)
                    cscores[cid] = score_val
                    cnotes[cid] = random.choice([
                        "Good approach with solid technical foundation.",
                        "Innovative but needs more feasibility analysis.",
                        "Strong potential impact on mobile AI.",
                        "Well-thought-out solution.",
                        "Creative idea, implementation could be challenging.",
                    ])

                r = await api(c, "post", f"/events/{event_id}/ideas/{idea_id}/scores", token,
                              json={"criteria_scores": cscores, "criteria_notes": cnotes})
                print(f"  {scorer_name} scored {target_name}'s idea: {r['total_score']:.1f}")

        print("\n=== DONE! ===")
        print(f"  Users: 12")
        print(f"  Problems: 10")
        print(f"  Rooms: 10")
        print(f"  Ideas in rooms: {len(ideas_in_rooms)}")
        print(f"  Event: {ev['title']}")
        print(f"  Teams: {len(team_ids)}")
        print(f"  Event Ideas: {sum(len(v) for v in event_idea_ids.values())}")
        print(f"  Scores: {sum(len(v) for v in event_idea_ids.values())}")


if __name__ == "__main__":
    asyncio.run(seed())
