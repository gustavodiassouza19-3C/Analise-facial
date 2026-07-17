import logging
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)


class SanitizedHTTPException(HTTPException):
    """HTTP exception that never exposes internal details to the client."""

    def __init__(
        self,
        status_code: int,
        public_message: str,
        internal_detail: str = "",
    ):
        super().__init__(status_code=status_code, detail=public_message)
        if internal_detail:
            logger.error("SanitizedHTTPException [%s]: %s", status_code, internal_detail)


def raise_ai_error(status_code: int, public_message: str, internal_detail: str = ""):
    raise SanitizedHTTPException(status_code, public_message, internal_detail)


def raise_db_error(internal_detail: str):
    raise SanitizedHTTPException(
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        "Erro interno ao processar sua solicitacao. Tente novamente.",
        internal_detail,
    )
