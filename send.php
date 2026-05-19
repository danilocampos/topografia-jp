<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

function clean(string $value): string {
    return htmlspecialchars(strip_tags(trim($value)), ENT_QUOTES, 'UTF-8');
}

$name    = clean($_POST['name']    ?? '');
$company = clean($_POST['company'] ?? '');
$email   = clean($_POST['email']   ?? '');
$phone   = clean($_POST['phone']   ?? '');
$service = clean($_POST['service'] ?? '');
$message = clean($_POST['message'] ?? '');

if (!$name || !$email || !$phone || !$message) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Campos obrigatórios ausentes.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'E-mail inválido.']);
    exit;
}

$to      = 'adm@topografiajp.com.br';
$subject = '=?UTF-8?B?' . base64_encode("Novo contato via site — $name") . '?=';

$body  = "Você recebeu uma nova mensagem pelo formulário do site.\n\n";
$body .= "Nome:     $name\n";
$body .= $company ? "Empresa:  $company\n" : '';
$body .= "E-mail:   $email\n";
$body .= "Telefone: $phone\n";
$body .= $service ? "Serviço:  $service\n" : '';
$body .= "\nMensagem:\n$message\n";

$headers  = "From: site@topografiajp.com.br\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$sent = mail($to, $subject, $body, $headers);

if ($sent) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Falha ao enviar e-mail. Tente novamente.']);
}
