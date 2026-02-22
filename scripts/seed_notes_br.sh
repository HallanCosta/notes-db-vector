#!/usr/bin/env bash
# Seed via edge function create-note (gera embeddings reais via Ollama)
# Uso: bash scripts/seed_notes_br.sh

SUPABASE_URL="${SUPABASE_URL:-http://localhost:54321}"
ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1sb2NhbCIsInJvbGUiOiJhbm9uIiwiZXhwIjoxOTgzODEyOTk2fQ.M5YxZEaHHJzS2YaxZ5KZokoZw7f4vGiOVu3_nsMln2c}"
ENDPOINT="$SUPABASE_URL/functions/v1/create-note"

create_note() {
  local title="$1"
  local content="$2"
  local response
  response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ANON_KEY" \
    -d "{\"title\": $(echo "$title" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read().strip()))'), \"content\": $(echo "$content" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read().strip()))')}")
  echo "$response"
}

notes=(
  # PIX
  "Sistema de Pagamento Instantâneo Brasileiro|O Pix é o sistema de pagamento instantâneo do Brasil lançado pelo Banco Central em 2020. Permite transferências 24h por dia em segundos, sem custo para pessoas físicas."
  "Chaves Pix e Cadastro|As chaves Pix são identificadores únicos vinculados a uma conta bancária. Cada pessoa pode cadastrar até 5 chaves por conta. Tipos: CPF, CNPJ, e-mail, telefone e chave aleatória."
  "QR Code Pix|O QR Code Pix pode ser estático ou dinâmico. O estático tem dados fixos e serve para pagamentos recorrentes. O dinâmico muda a cada transação e pode incluir informações como descrição e valor."
  "Segurança do Pix|O Pix possui múltiplas camadas de segurança: autenticação de dois fatores, biometria, token de dispositivo, monitoramento de fraudes em tempo real e limites configuráveis."
  # TED
  "Transferência Eletrônica Disponível|A TED é o sistema de transferência eletrônica entre diferentes bancos no Brasil. Utiliza a infraestrutura do Sistema de Transferência de Reservas (STR) do Banco Central. Normalmente creditada no mesmo dia útil."
  "Horários e Limites da TED|As transferências TED podem ser realizadas das 4h às 20h em dias úteis. O limite varia por banco e perfil do cliente. Valores acima de certos montantes podem exigir autorização adicional."
  "Diferenças entre TED e DOC|A TED é mais moderna e opera em tempo real durante o horário bancário. O DOC é mais antigo, com limite de R$4.999,99 e crédito no dia seguinte se realizado após o horário de corte."
  # Boleto
  "Boleto Bancário|O boleto é um documento de cobrança emitido por empresas autorizadas, instruindo o pagador a quitar uma dívida. Contém código de barras, dados do emitente, valor, vencimento e informações bancárias."
  "Registro de Boleto|Desde 2018, todos os boletos emitidos no Brasil devem ser registrados no banco emissor antes da apresentação ao pagador. O registro garante unicidade e rastreamento do status do pagamento em tempo real."
  # ISO 8583
  "ISO 8583 - Mensagens de Pagamento|O ISO 8583 é o padrão internacional para mensagens de transações com cartão de pagamento. Define formatos e códigos para autorização, captura e outros processos. Usado por Visa, Mastercard e outras redes."
  "Campos do ISO 8583|O ISO 8583 define campos numerados (DE1 a DE128) com informações como: número do cartão, data, valor, código de resposta, ID do estabelecimento e ID do terminal."
  "Mensagens do ISO 8583|As principais mensagens ISO 8583 são: 0100 (pedido de autorização), 0110 (resposta), 0200 (captura financeira), 0210 (resposta), 0400 (estorno), 0420 (resposta de estorno)."
  # ISO 20022
  "ISO 20022 - Padrão de Mensagens Financeiras|O ISO 20022 é o padrão global para mensagens financeiras usado em transferências, títulos e pagamentos. Oferece estrutura rica e hierárquica. Adotado pelo SWIFT e bancos centrais."
  "Mensagens pacs do ISO 20022|O namespace pacs contém mensagens de pagamento: pacs.002 (StatusReport), pacs.008 (FIToFIPaymentStatusReport). Usado em confirmações de pagamento e mensagens de retorno."
  "Pix usa ISO 20022|O Pix brasileiro adotou o padrão ISO 20022 para suas mensagens. Isso facilita a interoperabilidade internacional e usa namespaces como cact (CreditTransfer) e rjct (Rejection)."
  # SPI / DICT
  "Sistema de Pagamentos Instantâneos SPI|O SPI é a infraestrutura do Banco Central que viabiliza o Pix. Opera 24h por dia, 7 dias por semana, processa milhões de transações diariamente e conecta bancos, fintechs e cooperativas."
  "DICT - Diretório de Identificadores de Contas|O DICT é o diretório que armazena as chaves Pix e suas associações com instituições. Permite a resolução de chaves para localizar contas de destinatários. Gerenciado pelo Banco Central."
  "Open Finance e Pix|O Open Finance complementa o Pix ao permitir o compartilhamento de dados bancários e a iniciação de pagamentos. Juntos, criam um ecossistema de pagamentos moderno no Brasil."
  # Filmes
  "Clube da Luta|Clube da Luta é um filme de 1999 dirigido por David Fincher. Brad Pitt interpreta Tyler Durden e Edward Norton é o narrador. Tornou-se um clássico cult por sua crítica ao consumismo."
  "O Poderoso Chefão|O Poderoso Chefão é uma trilogia de Francis Ford Coppola sobre a família mafiosa Corleone. Com Marlon Brando e Al Pacino. Considerado um dos maiores filmes já feitos."
  "Matrix - Ficção Científica|Matrix é um filme de 1999 dos Irmãos Wachowski com Keanu Reeves. Explora a realidade simulada e a filosofia existencial. Introduziu o bullet time e sequências de ação revolucionárias."
  "Breaking Bad - Série|Breaking Bad é uma série americana sobre Walter White, um professor de química que se torna produtor de metanfetamina. Criada por Vince Gilligan, considerada uma das melhores séries de todos os tempos."
  "Oppenheimer - Filme Biográfico|Oppenheimer é um filme de Christopher Nolan sobre o pai da bomba atômica. Cillian Murphy interpreta J. Robert Oppenheimer. Venceu o Oscar de Melhor Filme em 2024."
  # Receitas
  "Feijoada Brasileira|A feijoada é o prato nacional do Brasil. Feita com feijão preto, carnes secas (costelinha, bacon, linguiça) e servida com arroz, couve, farofa e laranja. Origem africana e portuguesa."
  "Pizza Italiana|A pizza é um prato italiano que se tornou mundial. A versão napolitana tem massa fina, tomate San Marzano e mussarela de búfala. Usa fermentação longa e forno a lenha."
  "Sushi Japonês|O sushi é um prato japonês que combina arroz temperado com vinagre e peixe cru ou frutos do mar. Os tipos incluem nigiri, maki e sashimi. É um dos alimentos mais populares do mundo."
  "Ramen Japonês|O ramen é um prato japonês de macarrão em caldo temperado. Os tipos incluem Shoyu (shoyu), Shio (sal), Miso e Tonkotsu (osso de porco). Coberturas comuns: ovo, nori, cebolinha e chashu."
  "Tacos Mexicanos|Os tacos são um prato mexicano com tortilla de milho ou trigo recheada com vários ingredientes. Carnes como carne moída, frango e porco. Acompanhamentos incluem cebola, coentro, limão e molho picante."
  "Brigadeiro|O brigadeiro é um doce brasileiro de chocolate. Feito com leite condensado, cacau em pó e manteiga, decorado com granulado de chocolate. Tradicional em festas de aniversário."
  "Carbonara Italiana|A carbonara é um prato italiano de massa com ovo, queijo pecorino e guanciale servido com pimenta-do-reino. A versão autêntica não usa creme de leite. Roma é a capital não oficial do prato."
)

echo "Iniciando seed via edge function ($ENDPOINT)..."
echo "Total: ${#notes[@]} notas"
echo ""

success=0
fail=0

for note in "${notes[@]}"; do
  title="${note%%|*}"
  content="${note#*|}"
  status=$(create_note "$title" "$content")
  if [ "$status" = "201" ]; then
    echo "  [OK] $title"
    ((success++))
  else
    echo "  [ERRO $status] $title"
    ((fail++))
  fi
done

echo ""
echo "Concluido: $success OK, $fail erros"
