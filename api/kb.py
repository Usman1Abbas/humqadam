"""Knowledge base loader + grounding context for HumQadam.

For the hackathon MVP the KB is small and curated, so we inject the full
verified context into the LLM prompt (cross-lingual grounding handled by the
model). An optional semantic-retrieval path can be enabled later via
sentence-transformers without changing the API.
"""
import json
from pathlib import Path

_KB_PATH = Path(__file__).parent / "knowledge_base.json"


class KnowledgeBase:
    def __init__(self, path: Path = _KB_PATH):
        with open(path, encoding="utf-8") as f:
            self.entries = json.load(f)
        self.by_id = {e["id"]: e for e in self.entries}

    def context_block(self, topic: str | None = None) -> str:
        """Render KB entries as grounding context for the LLM."""
        entries = self.entries
        if topic:
            entries = [e for e in entries if e["topic"] == topic] or self.entries
        return "\n\n".join(
            f"[{e['id']}] (topic: {e['topic']})\n"
            f"Q: {e['question_en']}\n"
            f"A: {e['text_en']}\n"
            f"SOURCE: {e['source_title']} — {e['source_url']}"
            for e in entries
        )

    def resolve(self, ids: list[str]) -> list[dict]:
        """Map cited source ids to displayable source cards (deduped, ordered)."""
        seen, out = set(), []
        for i in ids:
            i = i.strip()
            e = self.by_id.get(i)
            if e and e["id"] not in seen and e["topic"] != "guardrail":
                seen.add(e["id"])
                out.append({
                    "id": e["id"],
                    "title": e["source_title"],
                    "url": e["source_url"],
                    "verified": e.get("last_verified", ""),
                })
        return out
