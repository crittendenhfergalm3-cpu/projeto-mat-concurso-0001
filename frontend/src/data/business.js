export const BUSINESS = {
  name: "São José Material de Construção",
  legalName: "SAO JOSE MATERIAL DE CONSTRUCAO LTDA - ME",
  cnpj: "60.219.119/0001-81",
  phone: "(98) 98847-3298",
  whatsapp: "5598988473298",
  email: "smart-fox387-ded9dd06@darkemail.school",
  address: {
    street: "Av. Vale do Pimenta, 5",
    district: "Parque Atlântico",
    city: "São Luís",
    state: "MA",
    cep: "65066-160",
  },
  hours: "Seg a Sex: 7h às 18h · Sáb: 7h às 13h",
  founded: "02/04/2025",
  mapsQuery: "Av.+Vale+do+Pimenta+5+Parque+Atlantico+Sao+Luis+MA",
};

export const fullAddress = `${BUSINESS.address.street} - ${BUSINESS.address.district}, ${BUSINESS.address.city}/${BUSINESS.address.state} - CEP ${BUSINESS.address.cep}`;

export const waLink = (text = "") =>
  `https://wa.me/${BUSINESS.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
