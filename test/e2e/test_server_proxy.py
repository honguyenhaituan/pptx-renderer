from __future__ import annotations

import server


def test_vite_proxy_headers_forward_accept_for_stylesheets():
    headers = server._vite_proxy_headers(
        {
            "accept": "text/css,*/*;q=0.1",
            "host": "127.0.0.1:8080",
            "connection": "keep-alive",
        }
    )

    assert headers == {"accept": "text/css,*/*;q=0.1"}
