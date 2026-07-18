import pytest

from lab05.auth import require_scope


def test_missing_token_is_unauthenticated() -> None:
    with pytest.raises(PermissionError, match="UNAUTHENTICATED"):
        require_scope(None, "incidents:read")


def test_under_scoped_token_is_forbidden() -> None:
    class Token:
        scopes = ["incidents:read"]

    with pytest.raises(PermissionError, match="FORBIDDEN"):
        require_scope(Token(), "incidents:propose")
