<?php
header("Content-Type: application/json; charset=UTF-8");

$url = "https://liturgia.cancaonova.com/pb/";

$html = file_get_contents($url);

if (!$html) {
  echo json_encode(["erro" => "Não foi possível carregar"]);
  exit;
}

// Exemplo simples (didático)
preg_match("/<article.*?>(.*?)<\/article>/s", $html, $matches);

$conteudo = $matches[1] ?? "Conteúdo indisponível";

echo json_encode([
  "data" => date("Y-m-d"),
  "conteudo" => $conteudo
]);v
