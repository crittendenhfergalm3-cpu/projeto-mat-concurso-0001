import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import { api } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPES = [
  { value: "all", label: "Todos os tipos" },
  { value: "apostila", label: "Apostilas" },
  { value: "curso", label: "Cursos" },
  { value: "combo", label: "Combos" },
];

const Catalog = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") || "";

  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [sort, setSort] = useState("recent");
  const [type, setType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api.get("/categories").then((r) => setCats(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { sort, limit: 48 };
    if (slug) params.category = slug;
    if (search) params.search = search;
    if (type !== "all") params.type = type;
    api
      .get("/products", { params })
      .then((r) => {
        setProducts(r.data.products);
        setTotal(r.data.total);
      })
      .finally(() => setLoading(false));
  }, [slug, search, sort, type]);

  const currentCat = cats.find((c) => c.slug === slug);
  const title = search
    ? `Resultados para "${search}"`
    : currentCat
    ? currentCat.name
    : "Apostilas & Cursos";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 md:text-3xl" data-testid="catalog-title">
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-500" data-testid="catalog-count">{total} material(is) disponível(is)</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-500" />
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-40" data-testid="type-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-44" data-testid="sort-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="price_asc">Menor preço</SelectItem>
              <SelectItem value="price_desc">Maior preço</SelectItem>
              <SelectItem value="name">Nome (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Carregando materiais...</div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground" data-testid="no-products">
          Nenhum material encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Catalog;
