from pydantic_settings import BaseSettings, SettingsConfigDict


class ConfigSettings(BaseSettings):
    MARKET_OPEN_TIME: str = "9:14"
    MARKET_CLOSE_TIME: str = "15:45"

    CORN_JOB_SECOND: int | None = 0
    CORN_JOB_MINUTE: int | None = None
    CORN_JOB_HOUR: int | None = None
    CORN_JOB_DAY: int | None = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


def get_config_settings() -> ConfigSettings:
    return ConfigSettings()
