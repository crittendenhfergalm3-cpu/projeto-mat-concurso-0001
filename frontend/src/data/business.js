export const BUSINESS = {
  name: "TÔ APROVADO",
  tagline: "Concursos Públicos",
  legalName: "TO APROVADO CURSOS PARA CONCURSOS PUBLICOS LTDA - ME",
  cnpj: "37.380.166/0001-90",
  phone: "(11) 3525-0800",
  whatsapp: "551135250800",
  email: "contato@toaprovado.com",
  address: {
    street: "R. Henri Dunant, 1066 - Apt 1403",
    district: "Santo Amaro",
    city: "São Paulo",
    state: "SP",
    cep: "04709-111",
  },
  hours: "Atendimento online: Seg a Sex, 9h às 18h",
  founded: "10/06/2020",
  mapsQuery: "R.+Henri+Dunant+1066+Santo+Amaro+Sao+Paulo+SP",
};

export const fullAddress = `${BUSINESS.address.street} - ${BUSINESS.address.district}, ${BUSINESS.address.city}/${BUSINESS.address.state} - CEP ${BUSINESS.address.cep}`;

export const waLink = (text = "") =>
  `https://wa.me/${BUSINESS.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
