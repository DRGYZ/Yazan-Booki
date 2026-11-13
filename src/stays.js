export const stays = [
  { id: 'du-port', name: 'Hôtel du port', type: 'hotel', price: 52, rating: 4 },
  { id: 'amina', name: 'Hôtel Chez Amina', type: 'hotel', price: 96, rating: 4 },
  { id: 'mouettes', name: 'Hôtel Les mouettes', type: 'hotel', price: 76, rating: 4 },
  { id: 'de-la-mer', name: 'Hôtel de la mer', type: 'hotel', price: 46, rating: 3 },
  { id: 'canebiere', name: 'Auberge La Canebière', type: 'auberge', price: 25, rating: 4 },
  { id: 'panier', name: 'Auberge Le Panier', type: 'auberge', price: 23, rating: 4, photo: 'panier-hostel' },
  { id: 'soleil', name: 'Hôtel Le soleil du matin', type: 'hotel', price: 25, rating: 4 },
  { id: 'coeur-eau', name: 'Chambres d’hôtes Au cœur de l’eau', type: 'chambre', price: 71, rating: 4 },
  { id: 'bleu-blanc', name: 'Hôtel Bleu et Blanc', type: 'hotel', price: 68, rating: 4 },
];

export const typeLabels = { hotel: 'Hôtel', auberge: 'Auberge', chambre: 'Chambre d’hôtes' };

function normalize(value) {
  return value.toLowerCase().replaceAll('œ', 'oe').normalize('NFD').replace(/\p{M}/gu, '');
}

export function selectStays({ query, types, budget, sort }) {
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  const matches = stays.filter((stay) => {
    const searchable = normalize(stay.name + ' Marseille');
    return (!types.length || types.includes(stay.type)) &&
      (!budget || stay.price < 50) &&
      terms.every((term) => searchable.includes(term));
  });

  if (sort === 'price-asc') return matches.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') return matches.sort((a, b) => b.price - a.price);
  if (sort === 'rating') return matches.sort((a, b) => b.rating - a.rating);
  return matches;
}
