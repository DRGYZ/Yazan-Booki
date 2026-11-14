export const stays = [
  {
    id: 'du-port',
    name: 'Hôtel du port',
    type: 'hotel',
    price: 52,
    rating: 4,
    quartier: 'Vieux-Port',
    walk: '2 min du ferry-boat',
    note: 'Façade sur les mâts, idéal pour partir tôt vers le Frioul.',
  },
  {
    id: 'amina',
    name: 'Hôtel Chez Amina',
    type: 'hotel',
    price: 96,
    rating: 4,
    quartier: 'Préfecture',
    walk: '10 min à pied du port',
    note: 'Cour intérieure calme entre commerces et terrasses du soir.',
  },
  {
    id: 'mouettes',
    name: 'Hôtel Les mouettes',
    type: 'hotel',
    price: 76,
    rating: 4,
    quartier: 'Corniche',
    walk: '3 min des bains de mer',
    note: 'Chambres claires au début de la Corniche Kennedy.',
  },
  {
    id: 'de-la-mer',
    name: 'Hôtel de la mer',
    type: 'hotel',
    price: 46,
    rating: 3,
    quartier: 'Vieux-Port Sud',
    walk: '4 min du quai de Rive-Neuve',
    note: 'Adresse simple et centrale côté Rive-Neuve.',
  },
  {
    id: 'canebiere',
    name: 'Auberge La Canebière',
    type: 'auberge',
    price: 25,
    rating: 4,
    quartier: 'Noailles',
    walk: '6 min du métro Vieux-Port',
    note: 'Dortoirs lumineux et grande cuisine à deux pas du marché.',
  },
  {
    id: 'panier',
    name: 'Auberge Le Panier',
    type: 'auberge',
    price: 23,
    rating: 4,
    photo: 'panier-hostel',
    quartier: 'Le Panier',
    walk: '5 min du Mucem',
    note: 'Ruelles en pente, volets pastel et petit-déjeuner sur terrasse.',
  },
  {
    id: 'soleil',
    name: 'Hôtel Le soleil du matin',
    type: 'hotel',
    price: 25,
    rating: 4,
    quartier: 'Longchamp',
    walk: '8 min de la gare TGV',
    note: 'Pratique en arrivant tard par le train, boulevard ombragé.',
  },
  {
    id: 'coeur-eau',
    name: 'Chambres d’hôtes Au cœur de l’eau',
    type: 'chambre',
    price: 71,
    rating: 4,
    quartier: 'Vallon des Auffes',
    walk: '2 min des rochers de baignade',
    note: 'Maison d’hôtes perchée au-dessus des barques du vallon.',
  },
  {
    id: 'bleu-blanc',
    name: 'Hôtel Bleu et Blanc',
    type: 'hotel',
    price: 68,
    rating: 4,
    quartier: 'La Joliette',
    walk: '5 min des navettes Frioul',
    note: 'Bâtiment rénové face aux bassins de la Joliette.',
  },
];

export const typeLabels = { hotel: 'Hôtel', auberge: 'Auberge', chambre: 'Chambre d’hôtes' };

function normalize(value) {
  return value.toLowerCase().replaceAll('œ', 'oe').normalize('NFD').replace(/\p{M}/gu, '');
}

export function selectStays({ query, types, budget, sort }) {
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  const matches = stays.filter((stay) => {
    const searchable = normalize([stay.name, stay.quartier, stay.note, 'Marseille'].filter(Boolean).join(' '));
    return (!types.length || types.includes(stay.type)) &&
      (!budget || stay.price < 50) &&
      terms.every((term) => searchable.includes(term));
  });

  if (sort === 'price-asc') return matches.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') return matches.sort((a, b) => b.price - a.price);
  if (sort === 'rating') return matches.sort((a, b) => b.rating - a.rating);
  return matches;
}
