#!/usr/bin/env bash
# Seed via edge function create-note (gera embeddings reais via Ollama)
# Uso: bash scripts/seed.sh

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
  "Brazilian Instant Payment System|Pix is Brazil's instant payment system launched by the Central Bank in 2020. Allows 24/7 transfers in seconds, at no cost for individuals."
  "Pix Keys and Registration|Pix keys are unique identifiers linked to a bank account. Each person can register up to 5 keys per account. Types: CPF, CNPJ, email, phone, and random key."
  "Pix QR Code|Pix QR Code can be static or dynamic. Static has fixed data and serves for recurring payments. Dynamic changes for each transaction."
  "Pix Security|Pix has multiple security layers: two-factor authentication, biometrics, device token, real-time fraud monitoring, and configurable limits."
  "Available Electronic Transfer|TED (Transferência Eletrônica Disponível) is the electronic transfer system between different banks in Brazil. Usually credited on the same business day."
  "TED Hours and Limits|TED transfers can be made from 4 AM to 8 PM on business days. The limit varies by bank and client profile."
  "Differences Between TED and DOC|TED is more modern and operates in real-time during banking hours. DOC is older, with a limit of R$4,999.99 and credit the next day."
  "Brazilian Bank Slip|The boleto is a payment slip issued by authorized companies, instructing the payer to settle a debt. Contains barcode, issuer data, amount, due date, and banking information."
  "Boleto Registration|Since 2018, all boletos issued in Brazil must be registered with the issuing bank before presentation to the payer."
  "ISO 8583 - Payment Messages|ISO 8583 is the international standard for payment card transaction messages. Used by networks like Visa, Mastercard, and other issuers worldwide."
  "ISO 8583 Fields|ISO 8583 defines numbered fields (DE1 to DE128) with information like: card number, date, amount, response code, merchant ID, terminal ID."
  "ISO 8583 Messages|The main ISO 8583 messages are: 0100 (authorization request), 0110 (response), 0200 (financial capture), 0210 (response), 0400 (chargeback)."
  "ISO 20022 - Financial Messages Standard|ISO 20022 is the global standard for financial messages, used in transfers, securities, trade finance, and payments. Adopted by SWIFT and central banks."
  "ISO 20022 pacs Messages|The pacs namespace contains payment messages: pacs.002 (StatusReport), pacs.008 (FIToFIPaymentStatusReport). Used in payment confirmation and return messages."
  "Pix Uses ISO 20022|Brazilian Pix adopted the ISO 20022 standard for its messages. This facilitates international interoperability."
  "Instant Payments System SPI|SPI (Sistema de Pagamentos Instantâneos) is the Central Bank infrastructure that enables Pix. Operates 24/7, processes millions of transactions daily."
  "DICT - Directory of Account Identifiers|DICT is the directory that stores Pix keys and their associations with institutions. Enables key resolution to locate recipient accounts."
  "Open Finance and Pix|Open Finance complements Pix by allowing banking data sharing and payment initiation. Together they create a modern Brazilian payment ecosystem."
  "Fight Club|Fight Club is a 1999 film directed by David Fincher. Brad Pitt plays Tyler Durden and Edward Norton is the narrator. A cult classic for its consumerism critique."
  "The Godfather|The Godfather is a film trilogy by Francis Ford Coppola about the Corleone mafia family. Considered one of the greatest films ever made."
  "Matrix - Science Fiction Film|Matrix is a 1999 film by the Wachowskis with Keanu Reeves. Explores simulated reality and existential philosophy."
  "Breaking Bad - TV Series|Breaking Bad is an American series about Walter White, a chemistry teacher who becomes a methamphetamine producer. Considered one of the best series of all time."
  "Oppenheimer - Biographical Film|Oppenheimer is a Christopher Nolan film about the father of the atomic bomb. Cillian Murphy portrays J. Robert Oppenheimer. Won Best Picture Oscar in 2024."
  "Brazilian Feijoada|Feijoada is Brazil's national dish. Made with black beans, dried meats and served with rice, collard greens, farofa, and orange."
  "Italian Pizza|Pizza is an Italian dish that became worldwide. The Neapolitan version has thin dough, San Marzano tomatoes, buffalo mozzarella."
  "Japanese Sushi|Sushi is a Japanese dish combining seasoned vinegar rice with raw fish or seafood. Types include nigiri, maki, and sashimi."
  "Japanese Ramen|Ramen is a Japanese dish of noodles in flavored broth. Types include Shoyu, Shio, Miso, and Tonkotsu."
  "Mexican Tacos|Tacos are a Mexican dish with corn or wheat tortilla filled with various fillings. Accompaniments include onion, cilantro, lime, and hot sauce."
  "Brigadeiro|Brigadeiro is a Brazilian chocolate sweet. Made with condensed milk, cocoa powder, butter decorated with chocolate sprinkles."
  "Italian Carbonara|Carbonara is an Italian pasta dish with egg, pecorino cheese, guanciale served with black pepper. Authentic version does not use cream."
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
  sleep 2
done

echo ""
echo "Concluido: $success OK, $fail erros"
