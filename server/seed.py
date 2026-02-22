"""
Seeder de notas para testar busca vetorial.
Execute: python seed.py
"""
import os
import requests
import sys
from dotenv import load_dotenv

load_dotenv()

# URL da API
API_URL = "http://localhost:8000"

# URL do banco (Supabase Local)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@127.0.0.1:54322/postgres")

# ============================================
# SQL para criar tabela (se não existir)
# ============================================
CREATE_TABLES_SQL = """
-- Habilitar extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela de notas
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(768) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca por similaridade
CREATE INDEX IF NOT EXISTS notes_embedding_idx 
ON notes 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
"""

def create_tables():
    """Cria as tabelas no banco se não existirem."""
    try:
        import psycopg
        print("🔧 Criando tabelas no banco...")
        conn = psycopg.connect(DATABASE_URL)
        conn.execute(CREATE_TABLES_SQL)
        conn.commit()
        conn.close()
        print("✅ Tabelas criadas com sucesso!\n")
        return True
    except ImportError:
        print("⚠️ psycopg não instalado. Execute: uv pip install psycopg-binary")
        print("   Ou crie as tabelas manualmente no Supabase Studio.\n")
        return False
    except Exception as e:
        print(f"⚠️ Erro ao criar tabelas: {e}")
        print("   Continue sem criar tabelas...\n")
        return False


# Lista de notas seedadas (em inglês para melhor performance do modelo de embeddings)
NOTES_SEED = [
    # PIX - Instant Payment System
    {
        "title": "Brazilian Instant Payment System",
        "content": "Pix is Brazil's instant payment system launched by the Central Bank in 2020. Allows 24/7 transfers in seconds, at no cost for individuals. Uses the Instant Payments System (SPI) infrastructure and supports random keys, CPF/CNPJ, email, and phone."
    },
    {
        "title": "Pix Keys and Registration",
        "content": "Pix keys are unique identifiers linked to a bank account. Each person can register up to 5 keys per account. Types: CPF, CNPJ, email, phone, and random key. Registration is done through the bank's app or Internet Banking."
    },
    {
        "title": "Pix Limits and Hours",
        "content": "Pix operates 24 hours a day, every day. Limits are set by each financial institution. Most banks offer generous limits for Pix transfers, reaching tens of thousands per transaction depending on the client's profile."
    },
    {
        "title": "Pix QR Code",
        "content": "Pix QR Code can be static or dynamic. Static has fixed data and serves for recurring payments. Dynamic changes for each transaction and can include additional information like description and amount. Read by the phone camera."
    },
    {
        "title": "Pix Security",
        "content": "Pix has multiple security layers: two-factor authentication, biometrics, device token, real-time fraud monitoring, and configurable limits. The Central Bank requires institutions to implement robust security mechanisms to protect users."
    },

    # TED - Electronic Transfer
    {
        "title": "Available Electronic Transfer",
        "content": "TED (Transferência Eletrônica Disponível) is the electronic transfer system between different banks in Brazil. Uses the Reserve Transfer System (STR) infrastructure from the Central Bank. Usually credited on the same business day."
    },
    {
        "title": "TED Hours and Limits",
        "content": "TED transfers can be made from 4 AM to 8 PM on business days. The limit varies by bank and client profile. Values above certain amounts may require additional authorization or be scheduled for the next day."
    },
    {
        "title": "Differences Between TED and DOC",
        "content": "TED is more modern and operates in real-time during banking hours. DOC (Documento de Ordem de Crédito) is older, with a limit of R$4,999.99 and credit the next day if made after the cutoff time. DOC is being gradually replaced by Pix."
    },
    {
        "title": "TED Fees for Legal Entities",
        "content": "Legal entities generally pay a fee for TED transfers, ranging from R$8 to R$20 per transaction depending on the bank and service package. For individuals, most banks do not charge for TED."
    },

    # BOLETO
    {
        "title": "Brazilian Bank Slip",
        "content": "The boleto is a payment slip issued by authorized companies, instructing the payer to settle a debt. Contains barcode (or QR Code), issuer data, amount, due date, and banking information. Can be paid at banks, ATMs, internet banking, or apps."
    },
    {
        "title": "Boleto Registration",
        "content": "Since 2018, all boletos issued in Brazil must be registered with the issuing bank before presentation to the payer. The registration process ensures uniqueness and allows real-time tracking of payment status."
    },
    {
        "title": "Registered vs Unregistered Boleto",
        "content": "Registered boleto has an identifiable number at the bank, enabling easier tracking and compensation. Unregistered is simpler but being gradually replaced. The change brought more security and fraud reduction."
    },
    {
        "title": "Boleto Due Date and Fees",
        "content": "Boleto can have a specific due date. After due date, interest and fees generally apply. The Consumer Defense Code limits interest to 1% per month and maximum penalty of 2% on the total amount."
    },

    # REGISTRADORA
    {
        "title": "Electronic Invoice to Consumer",
        "content": "NFC-e (Nota Fiscal Eletrônica ao Consumidor) is the document issued by retailers to record sales to final consumers. Replaces paper tax receipts in several states. Can be printed, sent by email, or displayed via QR Code."
    },
    {
        "title": "SAT Fiscal",
        "content": "SAT (Sistema Autenticador e Transmissor de Cupons Fiscais Eletrônicos) is mandatory equipment in several states for issuing electronic tax receipts. Generates and authenticates sales data, transmits to the Finance Secretary."
    },
    {
        "title": "Online Invoice Emitters",
        "content": "Electronic invoice emitters like NF-e and NFC-e are systems that allow legal issuance of tax documents. Integration with ERPs and marketplaces. Main ones: Emitente (free), NFe.io, and Nota Control."
    },
    {
        "title": "ECF - Receipt Printer",
        "content": "ECF (Emissor de Cupom Fiscal) is the traditional equipment for issuing tax receipts, required in states that have not yet implemented SAT or NFC-e. Prints thermal receipts and maintains fiscal memory."
    },

    # ISO 8583
    {
        "title": "ISO 8583 - Payment Messages",
        "content": "ISO 8583 is the international standard for payment card transaction messages. Defines formats and codes for authorization, capture, clearing, and other operations. Used by networks like Visa, Mastercard, and other issuers worldwide."
    },
    {
        "title": "ISO 8583 Fields",
        "content": "ISO 8583 defines numbered fields (DE1 to DE128) with information like: card number, date, amount, response code, merchant ID, terminal ID, etc. The 1987 version uses 128 fields, with bitmaps indicating which fields are present."
    },
    {
        "title": "ISO 8583 Messages",
        "content": "The main ISO 8583 messages are: 0100 (authorization request), 0110 (response), 0200 (financial capture), 0210 (response), 0400 (chargeback), 0420 (response). Each message has a specific purpose in the transaction lifecycle."
    },
    {
        "title": "ISO 8583 in ATMs",
        "content": "ATMs use ISO 8583 for communication with banking networks. Balance inquiry, withdrawal, transfer, and payment messages are all standardized. Binary or ASCII format varies by implementation."
    },

    # ISO 20022
    {
        "title": "ISO 20022 - Financial Messages Standard",
        "content": "ISO 20022 is the global standard for financial messages, used in transfers, securities, trade finance, and payments. Offers rich, hierarchical structure, different from limited ISO 15000. Adopted by SWIFT and central banks."
    },
    {
        "title": "ISO 20022 pacs Messages",
        "content": "The 'pacs' namespace contains payment messages: pacs.002 (StatusReport), pacs.003 (TransactionToReceiver), pacs.004 (ReturnTransaction), pacs.008 (FIToFIPaymentStatusReport). Used in payment confirmation and return messages."
    },
    {
        "title": "ISO 20022 pain Messages",
        "content": "The 'pain' namespace contains initiation messages: pain.001 (CustomerCreditTransferInitiation), pain.002 (PaymentStatusReport), pain.003 (MandateInitiationRequest). Used to initiate transfers and check status."
    },
    {
        "title": "Pix Uses ISO 20022",
        "content": "Brazilian Pix adopted the ISO 20022 standard for its messages. This facilitates international interoperability and uses namespaces like 'cact' (CreditTransfer), 'cncl' (Cancellation), and 'rjct' (Rejection) for transactions."
    },

    # ISO 18245
    {
        "title": "ISO 18245 - Merchant Category Codes",
        "content": "ISO 18245 defines MCC (Merchant Category Codes) to classify commercial establishments. Used in card transactions to identify business type: Restaurants (5812), Gas Stations (5541), Supermarkets (5411), etc."
    },
    {
        "title": "MCC Codes in Brazil",
        "content": "In Brazil, MCCs are used to identify segments in SPC, Serasa, and for expense categorization in open banking. Examples: 4789 (Transportation), 5942 (Bookstores), 5122 (Pharmacies), 5995 (Pet Shops)."
    },
    {
        "title": "Merchant Classification",
        "content": "MCC classification affects discount rates (interchange), cashback, loyalty program points, and expense reports. establishments can request classification change if the current code does not adequately represent their business."
    },

    # Instant Payments Brazil
    {
        "title": "Instant Payments System SPI",
        "content": "SPI (Sistema de Pagamentos Instantâneos) is the Central Bank infrastructure that enables Pix. Operates 24/7, processes millions of transactions daily, and connects banks, fintechs, cooperatives, and other participating institutions."
    },
    {
        "title": "DICT - Directory of Account Identifiers",
        "content": "DICT is the directory that stores Pix keys and their associations with institutions. Enables key resolution to locate recipient accounts. Managed by the Central Bank and accessed via SPI."
    },
    {
        "title": "Direct and Indirect Pix Participants",
        "content": "Direct Pix participants have accounts at the Central Bank and full access to SPI. Indirect participants are smaller, using direct participants' infrastructure. Includes banks, fintechs, cooperatives, and payment institutions."
    },
    {
        "title": "Open Finance and Pix",
        "content": "Open Finance complements Pix by allowing banking data sharing and payment initiation. Together, they create a modern Brazilian payment ecosystem with transparency, innovation, and competition."
    },
    {
        "title": "Pix Regulation Central Bank",
        "content": "BCB Resolution 1 and various circulars regulate Pix. They determine: free for individuals, R$500 limit per transaction (configurable), operating hours, security requirements, and data protection."
    },

    # Various
    {
        "title": "Open Banking Brazil",
        "content": "Open Banking (or Open Finance in Brazil) is the requirement for sharing data and services between financial institutions. Allows clients to share transaction history, contract services from other institutions via API."
    },
    {
        "title": "Payment Interoperability",
        "content": "Interoperability allows payments from one network to work on another. In Brazil, BC promoting Pix and Open Finance increases competition between banks and fintechs, benefiting consumers with more options and lower costs."
    },
    {
        "title": "Instant Payment Gateway",
        "content": "Payment gateways process online transactions. In Brazil, main ones: Mercado Pago, PagSeguro, Cielo, Stone, Adyen. Support multiple methods: card, Pix, boleto. Integration via REST API or SDK."
    },
    {
        "title": "Card Tokenization",
        "content": "Tokenization replaces card numbers with unique device-specific tokens. Used in digital wallets (Apple Pay, Google Pay) and online payments. Reduces fraud risk as tokens cannot be used outside the authorized device."
    },
    {
        "title": "3DS - Secure Authentication",
        "content": "3D Secure is the authentication protocol for card transactions. Adds additional verification layer via SMS, banking app, or biometrics. Mastercard (SecureCode) and Visa (Verified by Visa) implement proprietary versions."
    },
    {
        "title": "Anti-Fraud in Digital Payments",
        "content": "Anti-fraud systems use machine learning to analyze thousands of variables in milliseconds: geolocation, device fingerprint, purchase history, behavior patterns. Reduces chargebacks and losses for merchants."
    },

    # MOVIES AND TV SHOWS
    {
        "title": "Fight Club",
        "content": "Fight Club is a 1999 film directed by David Fincher, based on Chuck Palahniuk's novel. Brad Pitt plays Tyler Durden and Edward Norton is the narrator. The film became a cult classic for its consumerism critique and surprising narrative structure."
    },
    {
        "title": "The Godfather",
        "content": "The Godfather is a film trilogy by Francis Ford Coppola about the Corleone mafia family. Marlon Brando and Al Pacino star. Considered one of the greatest films ever made, won Oscars and defined the gangster genre."
    },
    {
        "title": "Matrix - Science Fiction Film",
        "content": "Matrix is a 1999 film by the Wachowskis with Keanu Reeves. Explores simulated reality and existential philosophy. Introduced bullet time and revolutionary action sequences. Had two direct sequels."
    },
    {
        "title": "Interstellar",
        "content": "Interstellar is a Christopher Nolan science fiction film about space travel and black holes. Matthew McConaughey stars as Cooper. Uses real physics and was praised for scientific accuracy in depicting black holes."
    },
    {
        "title": "Joker",
        "content": "Joker is a 2019 film by Todd Phillips with Joaquin Phoenix. Shows the origin of Batman's villain in Gotham City. Won the Oscar for Best Actor and generated controversy for its violence representation."
    },
    {
        "title": "Breaking Bad - TV Series",
        "content": "Breaking Bad is an American series about Walter White, a chemistry teacher who becomes a methamphetamine producer. Created by Vince Gilligan, considered one of the best series of all time. Lasted 5 seasons."
    },
    {
        "title": "Stranger Things - Netflix Series",
        "content": "Stranger Things is a Netflix science fiction series about a boy's disappearance and supernatural events in a small town. Created by the Duffer Brothers, combines horror, drama, and 80s elements."
    },
    {
        "title": "Game of Thrones - HBO Series",
        "content": "Game of Thrones is an epic fantasy series based on George R.R. Martin's books. HBO produced 8 seasons about power disputes in Westeros. Known for complex characters and unexpected endings."
    },
    {
        "title": "The Office - Comedy Series",
        "content": "The Office is an American comedy series about the daily life of an office. Based on the UK version by Ricky Gervais. Starring Steve Carell as Michael Scott. Lasted 9 seasons and spawned an Indian version."
    },
    {
        "title": "Money Heist - La Casa de Papel",
        "content": "La Casa de Papel is a Spanish series about the heist of the Royal Mint of Spain. Created by Álex Pina, was a global Netflix hit. Characters use city names and wear red as uniform."
    },
    {
        "title": "Parasite - Korean Film",
        "content": "Parasita is a South Korean film by Bong Joon-ho about social classes. Narrates the story of a poor family infiltrating a rich family. First non-English language film to win Best Picture Oscar."
    },
    {
        "title": "Avatar - James Cameron Film",
        "content": "Avatar is a 2009 science fiction film by James Cameron. Introduces the planet Pandora and the Na'vi. Holds the record for highest-grossing film of all time. Sequel Avatar: The Way of Water released in 2022."
    },
    {
        "title": "Inception",
        "content": "Inception is a Christopher Nolan film about thieves who steal secrets through shared dreams. Leonardo DiCaprio stars as Dom Cobb. The ambiguous ending sparks debates to this day."
    },
    {
        "title": "Avengers: Endgame",
        "content": "Avengers: Endgame is a 2019 Marvel superhero film. Directed by the Russo Brothers. Culminates the Infinity Saga with the final confrontation against Thanos. World record box office."
    },
    {
        "title": "The Lord of the Rings - Trilogy",
        "content": "The Lord of the Rings is a fantasy trilogy by Peter Jackson based on J.R.R. Tolkien's books. Frodo and the Fellowship seek to destroy the One Ring in Middle-earth. Multiple Oscar winner."
    },
    {
        "title": "Friends - Classic Series",
        "content": "Friends is a comedy series about a group of friends in New York. Starring Jennifer Aniston, Courteney Cox, Lisa Kudrow, Matt LeBlanc, Matthew Perry, and David Schwimmer. Lasted 10 seasons from 1994 to 2004."
    },
    {
        "title": "The Witcher - Netflix Series",
        "content": "The Witcher is a Netflix fantasy series based on Andrzej Sapkowski's books. Henry Cavill portrays the witcher Geralt. Combined with popular games from CD Projekt Red."
    },
    {
        "title": "Black Mirror - Anthology Series",
        "content": "Black Mirror is a British anthology series about technology and society. Created by Charlie Brooker. Each episode is an independent story exploring dark sides of modern technology."
    },
    {
        "title": "Star Wars - Space Saga",
        "content": "Star Wars is a space saga created by George Lucas. Includes films, series, games, and comics. Tells the story of Jedi, Sith, and the struggle between the light and dark side of the Force. One of the biggest franchises in history."
    },
    {
        "title": "The Dark Knight",
        "content": "The Dark Knight is a 2008 Batman film directed by Christopher Nolan. Christian Bale plays Batman and Heath Ledger plays Joker. Considered one of the best superhero films ever made."
    },
    {
        "title": "Schindler's List",
        "content": "Schindler's List is a Steven Spielberg film about Oskar Schindler who saved Jews from the Holocaust. Liam Neeson stars. Won 7 Oscars including Best Picture and Director."
    },
    {
        "title": "Pulp Fiction - Tarantino",
        "content": "Pulp Fiction is a Quentin Tarantino film with interwoven gangster stories. John Travolta, Samuel L. Jackson, and Uma Thurman star. Revolutionized non-linear narrative structure in cinema."
    },
    {
        "title": "Forrest Gump - Classic Film",
        "content": "Forrest Gump is a 1994 film with Tom Hanks. Tells the story of a low-IQ man who witnesses historical American events. Won 6 Oscars including Best Picture and Actor."
    },
    {
        "title": "The Irishman - Scorsese",
        "content": "The Irishman is a Martin Scorsese film about the Italian mafia. Robert De Niro, Al Pacino, and Joe Pesci star. Uses digital rejuvenation technology. Multiple Oscar nominee."
    },
    {
        "title": "House of Cards - Political Series",
        "content": "House of Cards is a Netflix series about American politics. Kevin Spacey plays Frank Underwood, an ambitious congressman. First Netflix original series to win an Emmy."
    },
    {
        "title": "Sherlock - BBC Series",
        "content": "Sherlock is a British BBC series with Benedict Cumberbatch as Sherlock Holmes. Modernizes Arthur Conan Doyle stories for the digital era. Known for clever writing and callbacks."
    },
    {
        "title": "Dark - German Series",
        "content": "Dark is a German Netflix science fiction series about time travel. Set in a small German town. First non-English series to become a global hit."
    },
    {
        "title": "WandaVision - Marvel Series",
        "content": "WandaVision is a Disney+ series with Elizabeth Olsen and Paul Bettany. Combines comedy, drama, and references to old sitcoms. Explores grief and alternate reality."
    },
    {
        "title": "Arcane - Animated Series",
        "content": "Arcane is an animated series based on the League of Legends universe. Developed by Riot Games and Fortiche. Praised for stylized animation and mature narrative. Emmy winner."
    },
    {
        "title": "Wednesday - Netflix Series",
        "content": "Wednesday is a Netflix series with Jenna Ortega as Wednesday Addams. Spin-off of The Addams Family. Became the most-watched Netflix series in its first week."
    },
    {
        "title": "Dune - Science Fiction Film",
        "content": "Dune is a 2021 science fiction film directed by Denis Villeneuve. Based on Frank Herbert's novel. Timothée Chalamet stars as Paul Atreides. Sequel Dune: Part Two in 2024."
    },
    {
        "title": "Oppenheimer - Biographical Film",
        "content": "Oppenheimer is a Christopher Nolan film about the father of the atomic bomb. Cillian Murphy portrays J. Robert Oppenheimer. Won Best Picture Oscar in 2024."
    },
    {
        "title": "Barbie - Greta Gerwig Film",
        "content": "Barbie is a 2023 comedy film directed by Greta Gerwig. Margot Robbie and Ryan Gosling star. Combines humor and social criticism. Highest-grossing film directed by a woman."
    },
    {
        "title": "Scary Movie - Comedy",
        "content": "Scary Movie is a 2000 parody comedy directed by Jay Roach. Parodies horror films like Scream, The Sixth Sense, and The Silence of the Lambs. Had 4 sequels."
    },
    {
        "title": "Sex Education - Netflix Series",
        "content": "Sex Education is a British Netflix series about a teenager who opens a sex education clinic at school. Asa Butterfield stars. Celebrated for positive representations of sexuality."
    },
    {
        "title": "Squid Game - Korean Series",
        "content": "Squid Game is a South Korean survival series where people play deadly games for money. Created by Hwang Dong-hyuk. First Korean series to win an Emmy."
    },
    {
        "title": "Succession - HBO Series",
        "content": "Succession is an HBO series about a media family. Brian Cox and Jeremy Strong star. Created by Jesse Armstrong. Multiple Emmy winner for best drama series."
    },
    {
        "title": "The Bear - Culinary Series",
        "content": "The Bear is a Hulu series about a chef taking over the family restaurant in Chicago. Jeremy Allen White stars. Celebrated for realistic representation of professional kitchens."
    },
    {
        "title": "The Last of Us - HBO Series",
        "content": "The Last of Us is an HBO series based on the Naughty Dog game. Pedro Pascal and Bella Ramsey star. Well-received video game adaptation with dramatic and emotional tone."
    },
    {
        "title": "Split - Shyamalan Film",
        "content": "Split is a 2016 horror film directed by M. Night Shyamalan. James McAvoy plays a man with 23 personalities. Sequel Glass labeled for 2024."
    },
    {
        "title": "Silicon Valley - Comedy Series",
        "content": "Silicon Valley is an HBO comedy series about tech startups. Created by Mike Judge. Thomas Middleditch stars as a programmer. Satirizes Silicon Valley tech culture."
    },
    {
        "title": "The Terminator",
        "content": "The Terminator is a science fiction franchise started in 1984. James Cameron directed the first two. Arnold Schwarzenegger is the iconic T-800. Explores time travel and AI."
    },
    {
        "title": "Back to the Future",
        "content": "Back to the Future is a science fiction trilogy about time travel. Michael J. Fox stars as Marty McFly. 80s icon with DeLorean as the time machine."
    },

    # RECIPES
    {
        "title": "Brazilian Feijoada",
        "content": "Feijoada is Brazil's national dish. Made with black beans, dried meats (ribs, bacon, sausage) and served with rice, collard greens, farofa, and orange. African and Portuguese origin, became an icon of Brazilian cuisine."
    },
    {
        "title": "Brazilian Barbecue",
        "content": "Churrasco is the Brazilian technique of grilling meats on the barbecue. Uses different cuts like picanha, sirloin, ribs served with rice, farofa, vinaigrette, and cheese bread. It's a gaucho tradition."
    },
    {
        "title": "Brazilian Fish Stew",
        "content": "Moqueca is a typical dish from Northeast Brazil, especially Bahia and Espírito Santo. Made with fish, shrimp, coconut milk, dendê oil, tomato, and spices. Cooked in clay pots."
    },
    {
        "title": "Mexican Guacamole",
        "content": "Guacamole is a Mexican sauce made with ripe avocado, onion, tomato, cilantro, lime served with tortilla chips. Originating from Mexico, it's popular worldwide. Rich in healthy fats."
    },
    {
        "title": "Italian Pizza",
        "content": "Pizza is an Italian dish that became worldwide. The Neapolitan version has thin dough, San Marzano tomatoes, buffalo mozzarella served with basil leaves. Uses long fermentation and wood-fired oven."
    },
    {
        "title": "Bolognese Lasagna",
        "content": "Lasagna is an Italian dish with layers of pasta, sauce, and filling. The Bolognese version uses ragù (meat sauce), béchamel, and cheese. Baked until golden."
    },
    {
        "title": "Spanish Paella",
        "content": "Paella is a Spanish dish from Valencia. Made with rice, saffron, chicken, seafood served directly in the paellera. There are meat (valenciana) and seafood (de Marisco) versions."
    },
    {
        "title": "Japanese Sushi",
        "content": "Sushi is a Japanese dish combining seasoned vinegar rice with raw fish or seafood. Types include nigiri, maki, and sashimi. It's one of the most popular foods in the world."
    },
    {
        "title": "Japanese Ramen",
        "content": "Ramen is a Japanese dish of noodles in flavored broth. Types include Shoyu (soy), Shio (salt), Miso, and Tonkotsu (pork bone). Common toppings: egg, nori, green onions, pork chashu."
    },
    {
        "title": "Mexican Tacos",
        "content": "Tacos are a Mexican dish with corn or wheat tortilla filled with various fillings. Meats like ground beef, chicken, pork. Accompaniments include onion, cilantro, lime, and hot sauce."
    },
    {
        "title": "Mexican Burrito",
        "content": "Burrito is a Mexican dish with wheat tortilla rolled with ingredients. Typical fillings include meat, rice, beans, cheese, guacamole, and sauces. Popular in the United States with tex-mex versions."
    },
    {
        "title": "Artisan Burger",
        "content": "Artisan burger is a sandwich with freshly ground meat, usually grilled. Brioche or traditional bread. Toppings: cheese, lettuce, tomato, onion, bacon, special sauces."
    },
    {
        "title": "Russian Stroganoff",
        "content": "Stroganoff is a Russian dish of beef cubes in cream sauce served with rice or potatoes. The Brazilian version includes ketchup and mushrooms. Popular throughout Brazil."
    },
    {
        "title": "Italian Carbonara",
        "content": "Carbonara is an Italian pasta dish with egg, pecorino cheese, guanciale (pork cheek) served with black pepper. Authentic version doesn't use cream. Rome is the unofficial capital."
    },
    {
        "title": "Pasta Carbonara",
        "content": "Pasta carbonara is a classic Italian recipe. Uses spaghetti, eggs, cheese, guanciale, and black pepper. The heat from the pasta cooks the eggs creating a creamy sauce. Simplicity and quality of ingredients are essential."
    },
    {
        "title": "Italian Risotto",
        "content": "Risotto is an Italian dish of rice cooked slowly with broth, white wine, and cheese. Arborio or Carnaroli rice releases starch creating creamy texture. Adding broth gradually is essential."
    },
    {
        "title": "Peruvian Ceviche",
        "content": "Ceviche is a South American dish of fish marinated in lime or lemon. Originating from Peru, also popular in Chile and Ecuador. Uses red onion, cilantro, ají served with sweet potato and corn."
    },
    {
        "title": "Indian Biryani",
        "content": "Biryani is an Indian dish of aromatic rice with spices and served with meat. Different regions have styles: Hyderabadi, Kolkata, Malabar. Made with basmati and spices like saffron and cardamom."
    },
    {
        "title": "Indian Curry",
        "content": "Curry is a broad term for spiced sauces in India. Types include Tikka Masala, Butter Chicken, Palak Paneer, Vindaloo. Served with basmati rice or naan bread."
    },
    {
        "title": "Thai Pad Thai",
        "content": "Pad Thai is a Thai dish of stir-fried rice noodles. Uses tamarind, fish sauce, palm sugar, peanuts served with lime. Popular street food throughout Thailand."
    },
    {
        "title": "Vietnamese Pho",
        "content": "Pho is a Vietnamese soup with rice noodles, beef or chicken broth served with toppings. Pho bo (beef) is the most popular. Accompaniments include mint, basil, lime, and chili."
    },
    {
        "title": "Korean Kimbap",
        "content": "Kimbap is a Korean dish similar to sushi, with nori and rice filled with vegetables, egg, meat served in slices. Popular snack for picnics and travel."
    },
    {
        "title": "Tonkotsu Ramen",
        "content": "Tonkotsu Ramen is a Japanese ramen style with thick pork bone broth. The broth is cooked for hours until milky. Hakata Ramen is the most famous Tonkotsu style."
    },
    {
        "title": "Japanese Carbonara",
        "content": "Japanese carbonara (Tonkotsu no Men) combines bacon, egg served over noodles. Different from Italian, uses milk or cream for smoothness. Popular in chains like Ichiran."
    },
    {
        "title": "Hawaiian Poke",
        "content": "Poke is a Hawaiian dish of raw fish cubes (usually tuna) marinated with soy sauce, sesame oil served with rice, avocado, edamame, and seaweed. Became a global healthy food trend."
    },
    {
        "title": "Middle Eastern Falafel",
        "content": "Falafel is a Middle Eastern food of deep-fried chickpea or fava bean balls. Used in sandwiches with pita, tahini, vegetables. Vegan and high in protein."
    },
    {
        "title": "Shawarma",
        "content": "Shawarma is a Middle Eastern dish of grilled meat on a vertical spit. Traditional chicken, lamb, or pork. Served in pita with tahini, hummus, vegetables, and pickles."
    },
    {
        "title": "Hummus",
        "content": "Hummus is a Middle Eastern dish of chickpea puree with tahini, olive oil, lemon served with pita bread. It's vegan and high in protein and fiber. Popular worldwide as a dip or spread."
    },
    {
        "title": "Baba Ganoush",
        "content": "Baba Ganoush is a grilled eggplant puree from the Middle East. Uses tahini, garlic, olive oil served with pita bread. Similar to hummus but with eggplant instead of chickpeas."
    },
    {
        "title": "Carne Asada Tacos",
        "content": "Carne Asada Tacos are Mexican tacos with grilled beef (carne asada). Served in corn tortilla with cilantro, onion, and green salsa. Meat marinated in orange served with lime."
    },
    {
        "title": "Enchiladas",
        "content": "Enchiladas are a Mexican dish of rolled tortillas with filling covered in pepper sauce. Types include enchiladas rojas (red sauce), verdes (green sauce), and en mole."
    },
    {
        "title": "Quesadilla",
        "content": "Quesadilla is a Mexican dish of wheat or corn tortilla with melted cheese. Can have additional fillings like meat, beans, mushrooms. Simple and quick to prepare."
    },
    {
        "title": "Brigadeiro",
        "content": "Brigadeiro is a Brazilian chocolate sweet. Made with condensed milk, cocoa powder, butter decorated with chocolate sprinkles. Traditional at birthday parties."
    },
    {
        "title": "Milk Pudding",
        "content": "Milk pudding is a Brazilian pudding with caramel. Made with condensed milk, milk, and eggs. Has caramelized sugar syrup. One of the most popular desserts in Brazil."
    },
    {
        "title": "Carrot Cake",
        "content": "Carrot cake is a Brazilian cake made with grated carrot. Chocolate topping is traditional. Made in a blender, quick and practical. Served at breakfast and snacks."
    },
    {
        "title": "Italian Tiramisu",
        "content": "Tiramisu is an Italian dessert of layers of savoiardi biscuits soaked in coffee with mascarpone and egg filling. Dusted with cocoa. Originates from the Treviso region."
    },
    {
        "title": "Cheesecake",
        "content": "Cheesecake is an American dessert with biscuit base and cream cheese filling. Variations include New York style, Japanese, and with fruits. Can be served with fruit sauce."
    },
    {
        "title": "Crème Brûlée",
        "content": "Crème Brûlée is a French dessert of vanilla custard with caramelized sugar crust. The sugar is burned with a torch creating crunchy texture over smooth custard."
    },
    {
        "title": "Chocolate Mousse",
        "content": "Chocolate mousse is a light and airy dessert of melted chocolate with whipped egg whites and/or cream. Chilled until set. Classic worldwide."
    },
    {
        "title": "Brownie",
        "content": "Brownie is an American chocolate dessert, dense served with nuts or not. Somewhere between cake and fudge. Usually served warm with ice cream or whipped cream."
    },
    {
        "title": "French Macarons",
        "content": "Macarons are a French dessert of meringue with filling between two cookies. Flavors vary: chocolate, fruits, coffee. Ladurée and Pierre Hermé are famous houses in Paris."
    },
    {
        "title": "Churros",
        "content": "Churros are a fried dough dessert originating from Spain and Portugal. Long ridged shape, dusted with sugar. Served with hot chocolate for dipping. Popular at fairs and parks."
    },
]


def create_note(note: dict) -> bool:
    """Cria uma nota na API."""
    try:
        response = requests.post(f"{API_URL}/notes", json=note, timeout=30)
        if response.status_code == 201:
            return True
        else:
            print(f"  Erro ao criar '{note['title']}': {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"  Erro de conexão: {e}")
        return False


def seed_notes():
    """Executa o seed de notas."""
    print(f"\n🌱 Iniciando seed de notas...")
    print(f"📡 Conectando em: {API_URL}\n")

    # Cria tabelas se não existirem
    create_tables()

    # Testa conexão
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        if response.status_code != 200:
            print("❌ API não está respondendo corretamente")
            return
    except requests.exceptions.RequestException:
        print("❌ Não foi possível conectar na API. Servidor está rodando?")
        print("   Execute: cd server && uvicorn main:app --reload")
        return

    # Limpa notas existentes
    print("🧹 Limpando notas existentes...")
    try:
        requests.delete(f"{API_URL}/notes", timeout=10)
    except:
        pass

    # Cria notas
    print(f"📝 Criando {len(NOTES_SEED)} notas...\n")

    success_count = 0
    for i, note in enumerate(NOTES_SEED, 1):
        print(f"  [{i}/{len(NOTES_SEED)}] {note['title']}...", end=" ")
        if create_note(note):
            print("✅")
            success_count += 1
        else:
            print("❌")

    print(f"\n🎉 Seed concluído!")
    print(f"   Sucesso: {success_count}/{len(NOTES_SEED)} notas criadas")
    print(f"   Total no banco: {success_count}")


if __name__ == "__main__":
    seed_notes()
