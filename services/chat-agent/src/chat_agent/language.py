import re

from chat_agent.schemas import ConversationMessage


def _looks_german(message: str) -> bool:
    return bool(
        re.search(
            r"\b(was|wohin|muss|gehört|gehoert|entsorge|entsorgen|müll|muell|kopfhoerer|kopfhörer)\b",
            message.casefold(),
        )
    )


def _looks_english(message: str) -> bool:
    return bool(
        re.search(
            r"\b("
            r"where|what|how|can|should|do|does|is|are|throw|away|dispose|disposal|bin|trash|"
            r"waste|recycling|recycle|batteries|battery|glass|clothes|clothing|electronics|"
            r"headphones|earbuds|pizza|box|carton|yogurt|cucumber|slices"
            r")\b",
            message.casefold(),
        )
    )


def _preferred_language(message: str, conversation_history: list[ConversationMessage]) -> str:
    first_user_message = next(
        (
            history_message.content
            for history_message in conversation_history
            if history_message.role == "user" and history_message.content.strip()
        ),
        "",
    )
    language_source = first_user_message or message
    if _looks_english(language_source):
        return "en"
    return "de"
