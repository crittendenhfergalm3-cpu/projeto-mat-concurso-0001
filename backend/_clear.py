from pymongo import MongoClient
c = MongoClient("mongodb://localhost:27017")
db = c["test_database"]
for coll in ["categories", "products", "concursos", "noticias"]:
    r = db[coll].delete_many({})
    print(coll, "cleared", r.deleted_count)
