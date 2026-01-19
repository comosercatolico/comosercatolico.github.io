<?php
header("Content-Type: application/json; charset=UTF-8");

$url = "https://liturgia.cancaonova.com/pb/";

$html = @file_get_contents($url);

if (!$html) {
  http_response_code(500);
  echo json_encode(["erro" => "Falha ao acessar a liturgia"]);
  exit;
}

libxml_use_internal_errors(true);
$dom = new DOMDocument();
$dom->loadHTML($html);
$xpath = new DOMXPath($dom);

function extrairTexto($xpath, $query) {
  $nodes = $xpath->query($query);
  $texto = "";
  foreach ($nodes as $node) {
    $texto .= trim($node->textContent) . "\n\n";
  }
  return trim($texto);
}

$salmo = extrairTexto($xpath, "//div[contains(@class,'salmo')]//p");
$evangelho = extrairTexto($xpath, "//div[contains(@class,'evangelho')]//p");

echo json_encode([
  "salmo" => $salmo ?: "Salmo não encontrado",
  "evangelho" => $evangelho ?: "Evangelho não encontrado"
]);

