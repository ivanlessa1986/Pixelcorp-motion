#!/usr/bin/env bash
# O kit usa o GSAP (biblioteca de animação, gratuita, https://gsap.com). O arquivo não é redistribuído aqui: baixe a versão testada (3.14.2) do jsDelivr.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p assets
curl -fsSL "https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js" -o assets/gsap.min.js
echo "ok: kit/assets/gsap.min.js (GSAP 3.14.2, licença própria do GSAP: https://gsap.com/standard-license)"
