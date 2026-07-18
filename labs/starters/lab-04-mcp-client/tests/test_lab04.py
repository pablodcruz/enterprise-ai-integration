from lab04.client import build_remote_mcp_config


def test_remote_config_filters_tools_and_requires_approval() -> None:
    config = build_remote_mcp_config(
        "https://mcp.example.test/mcp",
        ["search_incidents", "get_incident"],
    )
    assert config["type"] == "mcp"
    assert config["allowed_tools"] == ["search_incidents", "get_incident"]
    assert config["require_approval"] == "always"
