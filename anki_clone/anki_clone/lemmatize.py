import spacy

# Load the spanish model
nlp = spacy.load("es_core_news_md")

sentence = "El niño corrió rápidamente hacia la casa grande."

doc = nlp(sentence)

for token in doc:
    print(f"Word: {token.text}")
    print(f"  Lemma: {token.lemma_}")
    print(f"  POS: {token.pos_}")
    print()