from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class ConfigSettings(BaseSettings):
    MARKET_OPEN_TIME: str = "9:14"
    MARKET_CLOSE_TIME: str = "15:45"

    CORN_JOB_SECOND: int | None = 0
    CORN_JOB_MINUTE: int | None = None
    CORN_JOB_HOUR: int | None = None
    CORN_JOB_DAY: int | None = None

    JWT_SECRET: str = Field(min_length=10)
    JWT_EXPIRE_DAYS: int = 30
    JWT_ALGO: str = "HS256"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator(
        "CORN_JOB_MINUTE",
        "CORN_JOB_HOUR",
        "CORN_JOB_DAY",
        "CORN_JOB_SECOND",
        mode="before",
    )
    @classmethod
    def empty_str_to_none(cls, v):
        if v == "":
            return None
        return v


def get_config_settings() -> ConfigSettings:
    return ConfigSettings()  # pyright: ignore[reportCallIssue]
