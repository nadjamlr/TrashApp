from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ollama_host: str = "http://host.docker.internal:11434"
    ollama_model_text: str = "llama3"
    ollama_model_vision: str = "llava"
    groq_api_key: str = ""
    ors_api_key: str = ""
    rules_path: str = "/data/munich_rules.yaml"
    rules_agent_url: str = "http://rules-agent:8002"


settings = Settings()
