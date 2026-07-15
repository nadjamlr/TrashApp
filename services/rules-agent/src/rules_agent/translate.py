import difflib
import re

from trashapp_shared.ollama import generate_text
from trashapp_shared.settings import settings
from rules_agent.schemas import RulesResult

# Keyed by the exact source text - yaml/fallback content is static, so the same
# sentence is translated at most once per process lifetime instead of on every request.
_translation_cache: dict[str, str] = {}

# Terms that are already correct German municipal vocabulary and never need
# translating. Only skips the LLM call when the *entire* input is just one of
# these (e.g. a bare "Wertstoffhof" alternative) - safe because it doesn't touch
# ordinary sentences at all.
#
# Two more elaborate approaches were tried and reverted after live testing:
# 1. Listing these terms in the prompt as "do not translate" instructions made
#    the small local model (llama3.2) echo the instruction list itself instead
#    of translating the actual text.
# 2. Masking them out with placeholder tokens (e.g. "§0§") before translation
#    made the model hallucinate unrelated content or refuse to answer for some
#    inputs, and it didn't reliably copy the tokens back verbatim anyway.
# Both regressed quality below the plain, unqualified translation prompt, which
# reliably produces clean, readable German - just with occasional imperfect
# word choice for embedded German proper nouns. That's an accepted limitation
# of translating with a small local model rather than something to keep
# fighting via prompt engineering.
_PRESERVE_TERMS = {
    "Wertstoffhoefe", "Wertstoffhöfe", "Wertstoffhof", "Wertstoffinseln", "Wertstoffmobil",
    "Restmuelltonne", "Restmülltonne", "Biotonne", "Papiertonne",
    "Giftmobil", "Pfand", "AWM Altkleidercontainer", "AWM",
    "Sperrmuellabholung", "Sperrmüllabholung",
}


# Any run of Unicode letters (not just the "expected" German ones) - the model can
# occasionally substitute an unexpected accented character (e.g. "í" instead of
# "ü"), which would otherwise split the word at that character and break matching.
_WORD_PATTERN = re.compile(r"[^\W\d_]+", re.UNICODE)

# The model occasionally generates a near-miss spelling of a known term (e.g.
# "Restmílltonne" instead of "Restmülltonne" - one wrong character, otherwise
# correct). This is a plain post-processing fixup, not a prompt change, so it
# can't destabilize generation the way the earlier prompt-based attempts did.
def _correct_known_terms(text: str) -> str:
    def replace(match: re.Match) -> str:
        word = match.group(0)
        if word in _PRESERVE_TERMS:
            return word
        candidates = difflib.get_close_matches(word, _PRESERVE_TERMS, n=1, cutoff=0.82)
        if candidates and abs(len(candidates[0]) - len(word)) <= 2:
            return candidates[0]
        return word

    return _WORD_PATTERN.sub(replace, text)


async def _translate_to_german(text: str) -> str:
    text = text.strip()
    if not text:
        return text
    if text in _PRESERVE_TERMS:
        return text
    if text in _translation_cache:
        return _translation_cache[text]

    prompt = (
        "Translate the following English Munich waste-disposal text to German. "
        "Respond with ONLY the German translation, no quotes, no explanation.\n\n"
        f"{text}"
    )
    translated = (await generate_text(settings.ollama_model_text, prompt)).strip()
    translated = _correct_known_terms(translated)
    _translation_cache[text] = translated
    return translated


async def translate_result_to_german(result: RulesResult) -> RulesResult:
    return result.model_copy(
        update={
            "reasoning": await _translate_to_german(result.reasoning),
            "alternatives": [await _translate_to_german(a) for a in result.alternatives],
            "important_notes": [await _translate_to_german(n) for n in result.important_notes],
        }
    )
