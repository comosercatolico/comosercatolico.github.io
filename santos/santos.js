const listaSantos = [
  // --- APÓSTOLOS E EVANGELISTAS ---
  { nome: "São Pedro", categorias: ["Apóstolo", "Papa", "Mártir"] },
  { nome: "São Paulo", categorias: ["Apóstolo", "Mártir"] },
  { nome: "São João Evangelista", categorias: ["Apóstolo", "Evangelista"] },
  { nome: "São Mateus", categorias: ["Apóstolo", "Evangelista", "Mártir"] },
  { nome: "São Marcos", categorias: ["Evangelista", "Mártir"] },
  { nome: "São Lucas", categorias: ["Evangelista", "Mártir"] },
  { nome: "São Tiago Maior", categorias: ["Apóstolo", "Mártir"] },
  { nome: "São Tiago Menor", categorias: ["Apóstolo", "Mártir"] },
  { nome: "São Judas Tadeu", categorias: ["Apóstolo", "Mártir"] },
  { nome: "São Bartolomeu", categorias: ["Apóstolo", "Mártir"] },
  { nome: "São Simão", categorias: ["Apóstolo", "Mártir"] },
  { nome: "São Tomé", categorias: ["Apóstolo", "Mártir"] },
  { nome: "São Matias", categorias: ["Apóstolo", "Mártir"] },
  { nome: "São Filipe", categorias: ["Apóstolo", "Mártir"] },
  { nome: "São André", categorias: ["Apóstolo", "Mártir"] },
  { nome: "São Barnabé", categorias: ["Apóstolo", "Mártir"] },

  // --- DOUTORES DA IGREJA ---
  { nome: "São Tomás de Aquino", categorias: ["Doutor da Igreja", "Presbítero"] },
  { nome: "São Agostinho de Hipona", categorias: ["Doutor da Igreja", "Bispo"] },
  { nome: "São Jerônimo", categorias: ["Doutor da Igreja", "Presbítero"] },
  { nome: "São Gregório Magno", categorias: ["Doutor da Igreja", "Papa"] },
  { nome: "Santo Ambrósio", categorias: ["Doutor da Igreja", "Bispo"] },
  { nome: "São João Crisóstomo", categorias: ["Doutor da Igreja", "Bispo"] },
  { nome: "São Basílio Magno", categorias: ["Doutor da Igreja", "Bispo"] },
  { nome: "São Gregório Nazianzeno", categorias: ["Doutor da Igreja", "Bispo"] },
  { nome: "Santo Atanásio", categorias: ["Doutor da Igreja", "Bispo"] },
  { nome: "São Leão Magno", categorias: ["Doutor da Igreja", "Papa"] },
  { nome: "São Hilário de Poitiers", categorias: ["Doutor da Igreja", "Bispo"] },
  { nome: "São Cirilo de Alexandria", categorias: ["Doutor da Igreja", "Bispo"] },
  { nome: "São Cirilo de Jerusalém", categorias: ["Doutor da Igreja", "Bispo"] },
  { nome: "São João Damasceno", categorias: ["Doutor da Igreja", "Presbítero"] },
  { nome: "São Pedro Crisólogo", categorias: ["Doutor da Igreja", "Bispo"] },
  { nome: "Santo Isidoro de Sevilha", categorias: ["Doutor da Igreja", "Bispo"] },
  { nome: "São Beda o Venerável", categorias: ["Doutor da Igreja", "Presbítero"] },
  { nome: "São Pedro Damião", categorias: ["Doutor da Igreja", "Bispo"] },
  { nome: "Santo Anselmo de Cantuária", categorias: ["Doutor da Igreja", "Bispo"] },
  { nome: "São Bernardo de Claraval", categorias: ["Doutor da Igreja", "Abade"] },
  { nome: "São Boaventura", categorias: ["Doutor da Igreja", "Bispo"] },
  { nome: "Santo Alberto Magno", categorias: ["Doutor da Igreja", "Bispo"] },
  { nome: "Santo Antônio de Pádua", categorias: ["Doutor da Igreja", "Presbítero"] },
  { nome: "São João da Cruz", categorias: ["Doutor da Igreja", "Presbítero"] },
  { nome: "São Pedro Canísio", categorias: ["Doutor da Igreja", "Presbítero"] },
  { nome: "São Roberto Belarmino", categorias: ["Doutor da Igreja", "Bispo"] },
  { nome: "São Francisco de Sales", categorias: ["Doutor da Igreja", "Bispo"] },
  { nome: "Santo Afonso de Ligório", categorias: ["Doutor da Igreja", "Bispo"] },
  { nome: "São Lourenço de Brindisi", categorias: ["Doutor da Igreja", "Presbítero"] },
  { nome: "Santa Teresa d'Ávila", categorias: ["Doutor da Igreja", "Virgem"] },
  { nome: "Santa Catarina de Sena", categorias: ["Doutor da Igreja", "Virgem"] },
  { nome: "Santa Teresinha do Menino Jesus", categorias: ["Doutor da Igreja", "Virgem"] },
  { nome: "Santa Hildegarda de Bingen", categorias: ["Doutor da Igreja", "Virgem"] },
  { nome: "São João de Ávila", categorias: ["Doutor da Igreja", "Presbítero"] },
  { nome: "São Gregório de Narek", categorias: ["Doutor da Igreja", "Monge"] },
  { nome: "Santo Efrém da Síria", categorias: ["Doutor da Igreja", "Diácono"] },
  { nome: "São Ireneu de Lyon", categorias: ["Doutor da Igreja", "Bispo", "Mártir"] },

  // --- PAPAS ---
  { nome: "São Lino", categorias: ["Papa", "Mártir"] },
  { nome: "São Cleto", categorias: ["Papa", "Mártir"] },
  { nome: "São Clemente I", categorias: ["Papa", "Mártir"] },
  { nome: "São Sisto II", categorias: ["Papa", "Mártir"] },
  { nome: "São Cornélio", categorias: ["Papa", "Mártir"] },
  { nome: "São Fabiano", categorias: ["Papa", "Mártir"] },
  { nome: "São Calixto I", categorias: ["Papa", "Mártir"] },
  { nome: "São Ponciano", categorias: ["Papa", "Mártir"] },
  { nome: "São Silvestre I", categorias: ["Papa"] },
  { nome: "São Dâmaso I", categorias: ["Papa"] },
  { nome: "São Gregório VII", categorias: ["Papa"] },
  { nome: "São Pio V", categorias: ["Papa", "Religioso"] },
  { nome: "São Pio X", categorias: ["Papa"] },
  { nome: "São João XXIII", categorias: ["Papa"] },
  { nome: "São Paulo VI", categorias: ["Papa"] },
  { nome: "São João Paulo II", categorias: ["Papa"] },
  { nome: "São Melquíades", categorias: ["Papa"] },
  { nome: "São Zózimo", categorias: ["Papa"] },
  { nome: "São Bonifácio IV", categorias: ["Papa"] },
  { nome: "São Sérgio I", categorias: ["Papa"] },
  { nome: "São Pascoal I", categorias: ["Papa"] },
  { nome: "São Zacarias", categorias: ["Papa"] },
  { nome: "São João I", categorias: ["Papa", "Mártir"] },
  { nome: "São Martinho I", categorias: ["Papa", "Mártir"] },
  { nome: "São Silvério", categorias: ["Papa", "Mártir"] },
  { nome: "São Celestino V", categorias: ["Papa", "Eremita"] },

  // --- MÁRTIRES ---
  { nome: "Santo Estêvão", categorias: ["Mártir", "Diácono"] },
  { nome: "São Sebastião", categorias: ["Mártir"] },
  { nome: "São Jorge", categorias: ["Mártir"] },
  { nome: "São Lourenço", categorias: ["Mártir", "Diácono"] },
  { nome: "São Vicente de Saragoça", categorias: ["Mártir", "Diácono"] },
  { nome: "São Pantaleão", categorias: ["Mártir"] },
  { nome: "São Brás", categorias: ["Mártir", "Bispo"] },
  { nome: "São Januário", categorias: ["Mártir", "Bispo"] },
  { nome: "São Maurício", categorias: ["Mártir"] },
  { nome: "São Cristóvão", categorias: ["Mártir"] },
  { nome: "São Tarcísio", categorias: ["Mártir"] },
  { nome: "São Pancrácio", categorias: ["Mártir"] },
  { nome: "São Cipriano de Cartago", categorias: ["Mártir", "Bispo"] },
  { nome: "São Policarpo de Esmirna", categorias: ["Mártir", "Bispo"] },
  { nome: "São Inácio de Antioquia", categorias: ["Mártir", "Bispo"] },
  { nome: "São Justino Mártir", categorias: ["Mártir"] },
  { nome: "São Cosme", categorias: ["Mártir"] },
  { nome: "São Damião", categorias: ["Mártir"] },
  { nome: "São Longuinho", categorias: ["Mártir"] },
  { nome: "São Valentim", categorias: ["Mártir", "Presbítero"] },
  { nome: "Santa Inês", categorias: ["Mártir", "Virgem"] },
  { nome: "Santa Luzia", categorias: ["Mártir", "Virgem"] },
  { nome: "Santa Cecília", categorias: ["Mártir", "Virgem"] },
  { nome: "Santa Ágata", categorias: ["Mártir", "Virgem"] },
  { nome: "Santa Bárbara", categorias: ["Mártir", "Virgem"] },
  { nome: "Santa Catarina de Alexandria", categorias: ["Mártir", "Virgem"] },
  { nome: "Santa Perpétua", categorias: ["Mártir"] },
  { nome: "Santa Felicidade", categorias: ["Mártir"] },
  { nome: "Santa Blandina", categorias: ["Mártir"] },
  { nome: "Santa Eulália de Mérida", categorias: ["Mártir", "Virgem"] },
  { nome: "Santa Apolônia", categorias: ["Mártir", "Virgem"] },
  { nome: "Santa Bibiana", categorias: ["Mártir", "Virgem"] },
  { nome: "Santa Quitéria", categorias: ["Mártir", "Virgem"] },
  { nome: "Santa Engrácia", categorias: ["Mártir", "Virgem"] },
  { nome: "Santa Sabina", categorias: ["Mártir"] },
  { nome: "Santa Prisca", categorias: ["Mártir", "Virgem"] },
  { nome: "Santa Valéria", categorias: ["Mártir"] },
  { nome: "São Vital", categorias: ["Mártir"] },
  { nome: "São Gervásio", categorias: ["Mártir"] },
  { nome: "São Protásio", categorias: ["Mártir"] },
  { nome: "São Nazário", categorias: ["Mártir"] },
  { nome: "São Celso", categorias: ["Mártir"] },
  { nome: "São Vítor de Marselha", categorias: ["Mártir"] },
  { nome: "São Maximiliano de Tebessa", categorias: ["Mártir"] },
  { nome: "São Marcelo o Centurião", categorias: ["Mártir"] },
  { nome: "São Cassiano de Imola", categorias: ["Mártir"] },
  { nome: "São Quintino", categorias: ["Mártir"] },
  { nome: "São Bonifácio de Mogúncia", categorias: ["Mártir", "Bispo"] },
  { nome: "São Fidelis de Sigmaringa", categorias: ["Mártir", "Presbítero"] },
  { nome: "São Maximiliano Kolbe", categorias: ["Mártir", "Presbítero"] },
  { nome: "São Óscar Romero", categorias: ["Mártir", "Bispo"] },
  { nome: "São João de Brito", categorias: ["Mártir", "Missionário"] },
  { nome: "São Pedro Chanel", categorias: ["Mártir", "Missionário"] },
  { nome: "São Carlos Lwanga", categorias: ["Mártir"] },
  { nome: "São André Kim", categorias: ["Mártir", "Presbítero"] },
  { nome: "São Lourenço Ruiz", categorias: ["Mártir"] },
  { nome: "São Paulo Miki", categorias: ["Mártir", "Religioso"] },
  { nome: "São Josafá Kuncewicz", categorias: ["Mártir", "Bispo"] },
  { nome: "São João Houghton", categorias: ["Mártir", "Monge"] },
  { nome: "São Roberto Southwell", categorias: ["Mártir", "Presbítero"] },
  { nome: "São Edmundo Campion", categorias: ["Mártir", "Presbítero"] },
  { nome: "São Pedro de Arbués", categorias: ["Mártir", "Presbítero"] },
  { nome: "São Pelágio de Córdova", categorias: ["Mártir"] },
  { nome: "São Isaque Jogues", categorias: ["Mártir", "Missionário"] },
  { nome: "São João de Brébeuf", categorias: ["Mártir", "Missionário"] },
  { nome: "Santa Teresa Benedita da Cruz", categorias: ["Mártir", "Religiosa"] },
  { nome: "São Melchior de Garcia", categorias: ["Mártir", "Bispo"] },
  { nome: "São Valentim de Berriochoa", categorias: ["Mártir", "Bispo"] },
  { nome: "São Jerônimo Hermosilla", categorias: ["Mártir", "Bispo"] },
  { nome: "São Teófano Vénard", categorias: ["Mártir", "Presbítero"] },
  { nome: "São Paulo Chong", categorias: ["Mártir"] },
  { nome: "São João de Triora", categorias: ["Mártir", "Presbítero"] },
  { nome: "São Francisco de Capillas", categorias: ["Mártir", "Presbítero"] },
  { nome: "São Pedro o Aleuta", categorias: ["Mártir"] },
  { nome: "São Juvenal do Alasca", categorias: ["Mártir"] },
  { nome: "São Gorazd", categorias: ["Mártir", "Bispo"] },
  { nome: "São Filipe de Moscou", categorias: ["Mártir", "Bispo"] },
  { nome: "São Gabriel de Belostok", categorias: ["Mártir"] },
  { nome: "Santa Isabel a Nova Mártir", categorias: ["Mártir", "Religiosa"] },
  { nome: "Santa Maria de Paris", categorias: ["Mártir", "Religiosa"] },
  { nome: "São Rafael de Mitilene", categorias: ["Mártir", "Presbítero"] },
  { nome: "São Nicolau de Mitilene", categorias: ["Mártir", "Monge"] },
  { nome: "Santa Irene de Mitilene", categorias: ["Mártir"] },
  { nome: "São Cosme Etolo", categorias: ["Mártir", "Presbítero"] },
  { nome: "São Demétrio de Tessalônica", categorias: ["Mártir"] },
  { nome: "São Procópio", categorias: ["Mártir"] },
  { nome: "São Menas", categorias: ["Mártir"] },
  { nome: "São Teodoro Tiro", categorias: ["Mártir"] },
  { nome: "São Eustáquio", categorias: ["Mártir"] },
  { nome: "São Quirino de Sescia", categorias: ["Mártir", "Bispo"] },
  { nome: "São Floriano", categorias: ["Mártir"] },
  { nome: "São Bonifácio de Tarso", categorias: ["Mártir"] },
  { nome: "São Agatângelo", categorias: ["Mártir"] },
  { nome: "São Clemente de Ancira", categorias: ["Mártir", "Bispo"] },
  { nome: "São Vítor de Mauritânia", categorias: ["Mártir"] },
  { nome: "São Maximiliano de Celeia", categorias: ["Mártir", "Bispo"] },
  { nome: "São Câncio", categorias: ["Mártir"] },
  { nome: "São Canciano", categorias: ["Mártir"] },
  { nome: "Santa Cancianila", categorias: ["Mártir"] },
  { nome: "São Crescêncio", categorias: ["Mártir"] },
  { nome: "São Modesto", categorias: ["Mártir"] },
  { nome: "Santa Vitória", categorias: ["Mártir", "Virgem"] },
  { nome: "Santa Anatólia", categorias: ["Mártir", "Virgem"] },
  { nome: "São Máximo de Éfeso", categorias: ["Mártir"] },
  { nome: "São Jovino", categorias: ["Mártir"] },
  { nome: "São Basileu", categorias: ["Mártir"] },
  { nome: "São Magno", categorias: ["Mártir"] },
  { nome: "São Lúcio de Cirene", categorias: ["Mártir", "Bispo"] },
  { nome: "São Ptolomeu", categorias: ["Mártir"] },
  { nome: "São Caprasio", categorias: ["Mártir"] },
  { nome: "Santa Fides", categorias: ["Mártir", "Virgem"] },
  { nome: "Santa Spes", categorias: ["Mártir", "Virgem"] },
  { nome: "Santa Caritas", categorias: ["Mártir", "Virgem"] },
  { nome: "Santa Sofia de Roma", categorias: ["Mártir"] },
  { nome: "São Zenão", categorias: ["Mártir"] },
  { nome: "São Concórdio", categorias: ["Mártir"] },
  { nome: "São Calógero", categorias: ["Mártir"] },
  { nome: "São Símaco", categorias: ["Mártir"] },
  { nome: "São Sotero", categorias: ["Mártir", "Papa"] },
  { nome: "São Caio", categorias: ["Mártir", "Papa"] },
  { nome: "São Dionísio", categorias: ["Mártir", "Papa"] },
  { nome: "São Félix I", categorias: ["Mártir", "Papa"] },
  { nome: "São Ponciano", categorias: ["Mártir", "Papa"] },
  { nome: "São Sisto I", categorias: ["Mártir", "Papa"] },
  { nome: "São Telésforo", categorias: ["Mártir", "Papa"] },
  { nome: "São Higino", categorias: ["Mártir", "Papa"] },
  { nome: "São Pio I", categorias: ["Mártir", "Papa"] },
  { nome: "São Vítor I", categorias: ["Mártir", "Papa"] },
  { nome: "São Zeferino", categorias: ["Mártir", "Papa"] },
  { nome: "São Urbano I", categorias: ["Mártir", "Papa"] },
  { nome: "São Pontiano", categorias: ["Mártir", "Papa"] },
  { nome: "São Antero", categorias: ["Mártir", "Papa"] },
  { nome: "São Lúcio I", categorias: ["Mártir", "Papa"] },
  { nome: "São Estevão I", categorias: ["Mártir", "Papa"] },
  { nome: "São Eutiquiano", categorias: ["Mártir", "Papa"] },
  { nome: "São Marcelino", categorias: ["Mártir", "Papa"] },
  { nome: "São Marcelo I", categorias: ["Mártir", "Papa"] },
  { nome: "São Eusébio", categorias: ["Mártir", "Papa"] },

  // --- MISSIONÁRIOS E EVANGELIZADORES ---
  { nome: "São Francisco Xavier", categorias: ["Missionário", "Presbítero"] },
  { nome: "São José de Anchieta", categorias: ["Missionário", "Presbítero"] },
  { nome: "São Patrício", categorias: ["Missionário", "Bispo"] },
  { nome: "São Bonifácio", categorias: ["Missionário", "Bispo", "Mártir"] },
  { nome: "São Willibrordo", categorias: ["Missionário", "Bispo"] },
  { nome: "São Cirilo dos Eslavos", categorias: ["Missionário", "Monge"] },
  { nome: "São Metódio dos Eslavos", categorias: ["Missionário", "Bispo"] },
  { nome: "São Junípero Serra", categorias: ["Missionário", "Presbítero"] },
  { nome: "São Damião de Molokai", categorias: ["Missionário", "Presbítero"] },
  { nome: "São Roque González", categorias: ["Missionário", "Mártir"] },
  { nome: "São Pedro Claver", categorias: ["Missionário", "Presbítero"] },
  { nome: "São Turíbio de Mongrovejo", categorias: ["Missionário", "Bispo"] },
  { nome: "São Daniel Comboni", categorias: ["Missionário", "Bispo"] },
  { nome: "São Pedro Chanel", categorias: ["Missionário", "Mártir"] },
  { nome: "São Luís Beltrão", categorias: ["Missionário", "Presbítero"] },
  { nome: "São Francisco Solano", categorias: ["Missionário", "Presbítero"] },
  { nome: "São Nicolau do Japão", categorias: ["Missionário", "Bispo"] },
  { nome: "São Inocêncio do Alasca", categorias: ["Missionário", "Bispo"] },
  { nome: "São Germano do Alasca", categorias: ["Missionário", "Eremita"] },
  { nome: "São Justino de Jacobis", categorias: ["Missionário", "Bispo"] },
  { nome: "São Gabriel da Virgem Dolorosa", categorias: ["Missionário", "Religioso"] },
  { nome: "São Leopoldo Mandic", categorias: ["Missionário", "Presbítero"] },
  { nome: "São Charbel Makhlouf", categorias: ["Missionário", "Monge"] },

  // --- BISPOS, ABADES E PASTORES ---
  { nome: "São Martinho de Tours", categorias: ["Bispo"] },
  { nome: "São Nicolau de Mira", categorias: ["Bispo"] },
  { nome: "São Carlos Borromeu", categorias: ["Bispo"] },
  { nome: "São Teotônio", categorias: ["Abade"] },
  { nome: "São Leandro de Sevilha", categorias: ["Bispo"] },
  { nome: "São Ildefonso de Toledo", categorias: ["Bispo"] },
  { nome: "São Rosendo", categorias: ["Bispo"] },
  { nome: "São Froilán", categorias: ["Bispo"] },
  { nome: "São Genádio", categorias: ["Bispo"] },
  { nome: "São Romualdo", categorias: ["Abade"] },
  { nome: "São Columbano", categorias: ["Abade"] },
  { nome: "São João Maria Vianney", categorias: ["Presbítero", "Pastor"] },
  { nome: "São Óscar Romero", categorias: ["Bispo", "Mártir"] },
  { nome: "São Lucas da Crimeia", categorias: ["Bispo"] },
  { nome: "São João de Kronstadt", categorias: ["Presbítero"] },
  { nome: "São Serafim de Sarov", categorias: ["Monge"] },
  { nome: "São Nectários de Egina", categorias: ["Bispo"] },
  { nome: "São João de Xangai", categorias: ["Bispo"] },
  { nome: "São Tikhon de Moscou", categorias: ["Bispo"] },
  { nome: "São Demétrio de Rostov", categorias: ["Bispo"] },
  { nome: "São Tikhon de Zadonsk", categorias: ["Bispo"] },
  { nome: "São Teofânio o Recluso", categorias: ["Bispo"] },
  { nome: "São Pedro de Moscou", categorias: ["Bispo"] },
  { nome: "São Germano de Paris", categorias: ["Bispo"] },
  { nome: "São Remígio", categorias: ["Bispo"] },
  { nome: "São Cesário de Arles", categorias: ["Bispo"] },
  { nome: "São Gregório de Tours", categorias: ["Bispo"] },
  { nome: "São Martinho de Braga", categorias: ["Bispo"] },
  { nome: "São Frutuoso de Braga", categorias: ["Bispo"] },
  { nome: "São Geraldo de Braga", categorias: ["Bispo"] },
  { nome: "São Libório", categorias: ["Bispo"] },
  { nome: "São Malquias", categorias: ["Bispo"] },
  { nome: "São Vilfredo", categorias: ["Bispo"] },
  { nome: "São Ludgero", categorias: ["Bispo"] },
  { nome: "São Vigílio", categorias: ["Bispo"] },
  { nome: "São Maurílio de Angers", categorias: ["Bispo"] },
  { nome: "São Cutberto", categorias: ["Bispo"] },
  { nome: "São Dunstão", categorias: ["Bispo"] },
  { nome: "São Gildas", categorias: ["Abade"] },
  { nome: "São Bento de Aniane", categorias: ["Abade"] },
  { nome: "São Bruno de Segni", categorias: ["Bispo"] },
  { nome: "São Hugo de Cluny", categorias: ["Abade"] },
  { nome: "São Odilon de Cluny", categorias: ["Abade"] },
  { nome: "São João de Matha", categorias: ["Fundador"] },
  { nome: "São Félix de Valois", categorias: ["Fundador"] },
  { nome: "São João de Meda", categorias: ["Abade"] },
  { nome: "São Guilherme de Vercelli", categorias: ["Abade"] },
  { nome: "São João de Matera", categorias: ["Abade"] },
  { nome: "São Silvestre Gozzolini", categorias: ["Abade"] },
  { nome: "São Bernardo Tolomei", categorias: ["Abade"] },
  { nome: "São Tarásio", categorias: ["Bispo"] },
  { nome: "São Nicéforo de Constantinopla", categorias: ["Bispo"] },
  { nome: "São Metódio de Constantinopla", categorias: ["Bispo"] },
  { nome: "São João Mosco", categorias: ["Monge"] },

  // --- FUNDADORES E RELIGIOSOS ---
  { nome: "São Bento de Núrsia", categorias: ["Fundador", "Abade"] },
  { nome: "São Francisco de Assis", categorias: ["Fundador", "Religioso"] },
  { nome: "São Domingos de Gusmão", categorias: ["Fundador", "Presbítero"] },
  { nome: "Santo Inácio de Loyola", categorias: ["Fundador", "Presbítero"] },
  { nome: "São Bruno de Colônia", categorias: ["Fundador", "Monge"] },
  { nome: "São Norberto", categorias: ["Fundador", "Bispo"] },
  { nome: "São Camilo de Lellis", categorias: ["Fundador", "Presbítero"] },
  { nome: "São João de Deus", categorias: ["Fundador", "Religioso"] },
  { nome: "São Vicente de Paulo", categorias: ["Fundador", "Presbítero"] },
  { nome: "São João Bosco", categorias: ["Fundador", "Presbítero"] },
  { nome: "São Filipe Neri", categorias: ["Fundador", "Presbítero"] },
  { nome: "São Caetano", categorias: ["Fundador", "Presbítero"] },
  { nome: "São Jerônimo Emiliani", categorias: ["Fundador", "Presbítero"] },
  { nome: "São José de Calasanz", categorias: ["Fundador", "Presbítero"] },
  { nome: "São Paulo da Cruz", categorias: ["Fundador", "Presbítero"] },
  { nome: "São Pedro Julião Eymard", categorias: ["Fundador", "Presbítero"] },
  { nome: "São João Eudes", categorias: ["Fundador", "Presbítero"] },
  { nome: "São Luís Maria de Montfort", categorias: ["Fundador", "Presbítero"] },
  { nome: "São Francisco de Paula", categorias: ["Fundador", "Eremita"] },
  { nome: "São Luís Orione", categorias: ["Fundador", "Presbítero"] },
  { nome: "São João Calabria", categorias: ["Fundador", "Presbítero"] },
  { nome: "São Vicente Pallotti", categorias: ["Fundador", "Presbítero"] },
  { nome: "São Gaspar del Búfalo", categorias: ["Fundador", "Presbítero"] },
  { nome: "São Tiago Alberione", categorias: ["Fundador", "Presbítero"] },
  { nome: "São Francisco Coll", categorias: ["Fundador", "Presbítero"] },
  { nome: "São Enrique de Ossó", categorias: ["Fundador", "Presbítero"] },
  { nome: "Santa Clara de Assis", categorias: ["Fundadora", "Virgem"] },
  { nome: "Santa Beatriz da Silva", categorias: ["Fundadora", "Virgem"] },
  { nome: "Santa Ângela de Mérici", categorias: ["Fundadora", "Virgem"] },
  { nome: "Santa Paula Frassinetti", categorias: ["Fundadora", "Virgem"] },
  { nome: "Santa Paulina", categorias: ["Fundadora", "Virgem"] },
  { nome: "Santa Teresa de Calcutá", categorias: ["Fundadora", "Virgem"] },
  { nome: "Santa Joaquina de Vedruna", categorias: ["Fundadora", "Virgem"] },
  { nome: "Santa Vicenta Maria", categorias: ["Fundadora", "Virgem"] },
  { nome: "Santa Maria de Mattias", categorias: ["Fundadora", "Virgem"] },
  { nome: "Santa Luísa de Marillac", categorias: ["Fundadora", "Virgem"] },
  { nome: "Santa Joana de Lestonnac", categorias: ["Fundadora", "Virgem"] },
  { nome: "Santa Madalena Sofia Barat", categorias: ["Fundadora", "Virgem"] },
  { nome: "Santa Rosa Filipina Duchesne", categorias: ["Fundadora", "Virgem"] },
  { nome: "Santa Brígida da Suécia", categorias: ["Fundadora", "Religiosa"] },
  { nome: "Santa Coleta", categorias: ["Fundadora", "Virgem"] },
  { nome: "Santa Francisca Xavier Cabrini", categorias: ["Fundadora", "Virgem"] },
  { nome: "Santa Maria Mazzarello", categorias: ["Fundadora", "Virgem"] },
  { nome: "Santa Faustina Kowalska", categorias: ["Religiosa", "Mística"] },
  { nome: "Santa Maria MacKillop", categorias: ["Fundadora", "Religiosa"] },
  { nome: "São Charbel Makhlouf", categorias: ["Monge", "Místico"] },
  { nome: "São Pio de Pietrelcina", categorias: ["Presbítero", "Místico"] },
  { nome: "Santa Rita de Cássia", categorias: ["Religiosa", "Mística"] },
  { nome: "Santa Verônica Giuliani", categorias: ["Virgem", "Mística"] },
  { nome: "Santa Maria Madalena de Pazzi", categorias: ["Virgem", "Mística"] },
  { nome: "Santa Catarina de Bolonha", categorias: ["Virgem", "Mística"] },
  { nome: "Santa Gema Galgani", categorias: ["Virgem", "Mística"] },
  { nome: "Santa Escolástica", categorias: ["Virgem", "Religiosa"] },
  { nome: "Santo Antão do Deserto", categorias: ["Abade", "Eremita"] },
  { nome: "São Simeão Estilita", categorias: ["Eremita"] },
  { nome: "São Macário o Grande", categorias: ["Abade"] },
  { nome: "São Pacômio", categorias: ["Abade"] },
  { nome: "São Paulo de Tebas", categorias: ["Eremita"] },
  { nome: "São João Clímaco", categorias: ["Abade", "Místico"] },
  { nome: "São Serafim de Sarov", categorias: ["Monge", "Místico"] },
  { nome: "São Siluane o Atonita", categorias: ["Monge"] },
  { nome: "São Paisios o Atonita", categorias: ["Monge"] },
  { nome: "São Porfírio de Cavo-Sivília", categorias: ["Monge"] },
  { nome: "São Nicodemos o Agiorita", categorias: ["Monge"] },
  { nome: "São Bento José Labre", categorias: ["Confessor"] },
  { nome: "São Martinho de Lima", categorias: ["Religioso"] },
  { nome: "São Benedito o Mouro", categorias: ["Religioso"] },
  { nome: "Santa Bernadette Soubirous", categorias: ["Virgem"] },
  { nome: "Santa Rosa de Lima", categorias: ["Virgem"] },
  { nome: "Santa Mariana de Jesus", categorias: ["Virgem"] },
  { nome: "Santa Teresa dos Andes", categorias: ["Virgem"] },
  { nome: "São Leonardo de Porto Maurício", categorias: ["Presbítero"] },
  { nome: "São Pascoal Bailão", categorias: ["Religioso"] },
  { nome: "São Bernardino de Sena", categorias: ["Presbítero"] },
  { nome: "São Diogo de Alcalá", categorias: ["Religioso"] },
  { nome: "São Pedro de Alcântara", categorias: ["Presbítero"] },
  { nome: "São Cláudio de la Colombière", categorias: ["Presbítero"] },
  { nome: "Santa Margarida Maria Alacoque", categorias: ["Virgem"] },
  { nome: "São Francisco de Borja", categorias: ["Presbítero"] },
  { nome: "São Estanislau Kostka", categorias: ["Religioso"] },
  { nome: "São João Berchmans", categorias: ["Religioso"] },
  { nome: "São João de Sahagún", categorias: ["Presbítero"] },
  { nome: "São Tomás de Vilanova", categorias: ["Bispo"] },
  { nome: "São Nicolau Tolentino", categorias: ["Presbítero"] },
  { nome: "São João de Kanty", categorias: ["Presbítero"] },
  { nome: "São Jacinto", categorias: ["Presbítero"] },
  { nome: "São Vicente Ferrer", categorias: ["Presbítero"] },
  { nome: "São Pedro de Verona", categorias: ["Mártir", "Presbítero"] },
  { nome: "São Raimundo de Penaforte", categorias: ["Presbítero"] },
  { nome: "Santo Antonino de Florença", categorias: ["Bispo"] },
  { nome: "Santa Catarina de Gênova", categorias: ["Mística"] },
  { nome: "São Pedro Nolasco", categorias: ["Fundador"] },
  { nome: "São Pedro Armengol", categorias: ["Mártir"] },
  { nome: "São Serapião de Argel", categorias: ["Mártir"] },
  { nome: "Santa Brígida de Kildare", categorias: ["Abadessa"] },
  { nome: "São Geraldo Majella", categorias: ["Religioso"] },
  { nome: "São Clemente Hofbauer", categorias: ["Presbítero"] },
  { nome: "São João Neumann", categorias: ["Bispo"] },
  { nome: "São Pedro Fourier", categorias: ["Presbítero"] },
  { nome: "Santa Genoveva", categorias: ["Virgem"] },

  // --- LEIGOS E JUSTOS ---
  { nome: "São José", categorias: ["Justo"] },
  { nome: "Santa Maria Madalena", categorias: ["Justa"] },
  { nome: "Santa Ana", categorias: ["Justa"] },
  { nome: "São Joaquim", categorias: ["Justo"] },
  { nome: "São Zacarias", categorias: ["Justo"] },
  { nome: "Santa Isabel", categorias: ["Justa"] },
  { nome: "Santa Marta", categorias: ["Justa"] },
  { nome: "São Lázaro", categorias: ["Justo"] },
  { nome: "Santa Verônica", categorias: ["Justa"] },
  { nome: "São Dimas", categorias: ["Justo"] },
  { nome: "Santa Mônica", categorias: ["Justa"] },
  { nome: "Santa Helena", categorias: ["Justa", "Imperatriz"] },
  { nome: "São Luís de França", categorias: ["Rei", "Justo"] },
  { nome: "Santa Isabel de Portugal", categorias: ["Rainha", "Justa"] },
  { nome: "Santa Isabel da Hungria", categorias: ["Rainha", "Justa"] },
  { nome: "Santa Margarida da Escócia", categorias: ["Rainha", "Justa"] },
  { nome: "São Fernando III de Castela", categorias: ["Rei", "Justo"] },
  { nome: "São Casimiro", categorias: ["Justo"] },
  { nome: "Santo Estevão da Hungria", categorias: ["Rei", "Justo"] },
  { nome: "São Leopoldo III", categorias: ["Justo"] },
  { nome: "Santa Clotilde", categorias: ["Rainha", "Justa"] },
  { nome: "Santa Bathildis", categorias: ["Rainha", "Justa"] },
  { nome: "Santa Radegunda", categorias: ["Rainha", "Justa"] },
  { nome: "Santa Margarida da Hungria", categorias: ["Justa"] },
  { nome: "Santa Eduviges", categorias: ["Justa"] },
  { nome: "Santa Adelaide", categorias: ["Imperatriz", "Justa"] },
  { nome: "Santa Cunegundes", categorias: ["Imperatriz", "Justa"] },
  { nome: "Santa Joana de Portugal", categorias: ["Justa"] },
  { nome: "São Nuno de Santa Maria", categorias: ["Justo"] },
  { nome: "São Pier Giorgio Frassati", categorias: ["Justo"] },
  { nome: "São Contardo Ferrini", categorias: ["Justo"] },
  { nome: "São Zeferino Namuncurá", categorias: ["Justo"] },
  { nome: "São Nunzio Sulprizio", categorias: ["Justo"] },
  { nome: "Santa Zita", categorias: ["Justa"] },
  { nome: "São Giuseppe Moscati", categorias: ["Médico", "Justo"] },
  { nome: "São Ricardo Pampuri", categorias: ["Médico", "Justo"] },
  { nome: "Santa Gianna Beretta Molla", categorias: ["Médica", "Justa"] },
  { nome: "São Domingos Sávio", categorias: ["Justo"] },
  { nome: "Santa Maria de Cleofas", categorias: ["Justa"] },
  { nome: "Santa Salomé", categorias: ["Justa"] },
  { nome: "Santa Joana a Mirófora", categorias: ["Justa"] },
  { nome: "Santa Susana", categorias: ["Justa"] },
  { nome: "São Roque", categorias: ["Justo"] },
  { nome: "São Luís Gonzaga", categorias: ["Religioso", "Justo"] },
  { nome: "Santa Kateri Tekakwitha", categorias: ["Justa"] },
  { nome: "Santa Dulce dos Pobres", categorias: ["Religiosa", "Justa"] },
  { nome: "São Juan Diego", categorias: ["Justo"] },
  { nome: "Santa Josefina Bakhita", categorias: ["Religiosa", "Justa"] },
  { nome: "Santa Xenia de São Petersburgo", categorias: ["Justa"] },
  { nome: "Santa Matrona de Moscou", categorias: ["Justa"] },
  { nome: "São Vardan Mamikonian", categorias: ["Mártir", "Justo"] },
  { nome: "São Mesrob Mashtots", categorias: ["Monge", "Justo"] },
  { nome: "São Guido de Anderlecht", categorias: ["Justo"] },
  { nome: "São Homobono", categorias: ["Justo"] },
  { nome: "São Isidoro Lavrador", categorias: ["Justo"] },
  { nome: "Santa Maria da Cabeça", categorias: ["Justa"] },
  { nome: "São Gonçalo de Amarante", categorias: ["Justo"] },
  { nome: "Santa Rosa de Viterbo", categorias: ["Justa"] },
  { nome: "São Carlos o Bom", categorias: ["Justo"] },
  { nome: "Santa Edviges da Polônia", categorias: ["Rainha", "Justa"] },
  { nome: "São Roberto de Molesme", categorias: ["Abade", "Justo"] },
  { nome: "São Alberico", categorias: ["Abade", "Justo"] },
  { nome: "São Estêvão Harding", categorias: ["Abade", "Justo"] },
  { nome: "São Bruno de Segni", categorias: ["Bispo", "Justo"] },
  { nome: "São Bento de Aniane", categorias: ["Abade", "Justo"] },
  { nome: "São João de Meda", categorias: ["Abade", "Justo"] },
  { nome: "São Guilherme de Vercelli", categorias: ["Abade", "Justo"] },
  { nome: "São João de Matera", categorias: ["Abade", "Justo"] },
  { nome: "São Silvestre Gozzolini", categorias: ["Abade", "Justo"] },
  { nome: "São Bernardo Tolomei", categorias: ["Abade", "Justo"] },
  { nome: "São Marcos de Arethusa", categorias: ["Bispo", "Justo"] },
  { nome: "São Paulino de Nola", categorias: ["Bispo", "Justo"] },
  { nome: "São Sulpício Severo", categorias: ["Justo"] },
  { nome: "São Sidônio Apolinário", categorias: ["Bispo", "Justo"] },
  { nome: "São Venâncio Fortunato", categorias: ["Bispo", "Justo"] },
  { nome: "São Columba de Iona", categorias: ["Abade", "Justo"] },
  { nome: "São Kevin", categorias: ["Abade", "Justo"] },
  { nome: "São Brendano", categorias: ["Abade", "Justo"] },
  { nome: "São David de Gales", categorias: ["Bispo", "Justo"] },
  { nome: "São Ricardo de Chichester", categorias: ["Bispo", "Justo"] },
  { nome: "São Hugo de Lincoln", categorias: ["Bispo", "Justo"] },
  { nome: "São Gilberto de Sempringham", categorias: ["Justo"] },
  { nome: "São Simão Stock", categorias: ["Religioso", "Justo"] },
  { nome: "São Nicolau de Flüe", categorias: ["Justo"] },
  { nome: "Santa Francisca Romana", categorias: ["Justa"] },
  { nome: "Santa Paula de Roma", categorias: ["Justa"] },
  { nome: "Santa Eustáquia Calafato", categorias: ["Justa"] },
  { nome: "Santa Camila Batista da Varano", categorias: ["Justa"] },
  { nome: "Santa Osanna de Mantua", categorias: ["Justa"] },
  { nome: "Santa Colomba de Rieti", categorias: ["Justa"] },
  { nome: "Santa Lúcia de Narni", categorias: ["Justa"] },
  { nome: "Santa Catarina de Racconigi", categorias: ["Justa"] },
  { nome: "Santa Estefânia Quinzani", categorias: ["Justa"] },
  { nome: "Santa Arcângela Girlani", categorias: ["Justa"] },
  { nome: "Santa Madalena de Panattieri", categorias: ["Justa"] },
  { nome: "São João de Sahagún", categorias: ["Justo"] },
  { nome: "São Galgano", categorias: ["Justo"] },
  { nome: "Santa Verônica", categorias: ["Justa"] }
];
/* =========================
      CONFIGURAÇÕES GERAIS
========================= */
const grid = document.getElementById("santosGrid");
const pesquisaInput = document.getElementById("pesquisaSantos");
const categoriasContainer = document.getElementById("categoriasContainer");

const baseDados = typeof listaSantos !== 'undefined' ? listaSantos : [];

/* =========================
      MOTOR DE RENDERIZAÇÃO
========================= */
const appearanceObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            appearanceObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

function renderizarGrid(lista) {
    if (!grid) return;
    grid.innerHTML = "";
    const fragment = document.createDocumentFragment();

    lista.forEach((santo, index) => {
        const card = document.createElement("article");
        card.className = "santo-card";
        card.style.transitionDelay = `${(index % 15) * 30}ms`;

        // Normalização do nome para o arquivo de imagem
        const nomeArquivo = santo.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-');

        card.innerHTML = `
            <div class="card-inner">
                <div class="santo-badge-container">
                    ${santo.categorias.map(c => `<span class="badge">${c}</span>`).join(' ')}
                </div>
                <div class="image-container">
                    <img src="../imagens/santos/${nomeArquivo}.jpg" 
                         onerror="this.src='../imagens/default.jpg'" 
                         alt="${santo.nome}" loading="lazy">
                </div>
                <div class="santo-card-content">
                    <h3>${santo.nome}</h3>
                    <div class="card-footer">
                        <button class="btn-primary" onclick="abrirModal('${santo.nome.replace(/'/g, "\\'")}')">
                            <span>Ler Biografia</span>
                            <i class="fas fa-book-open"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        fragment.appendChild(card);
        appearanceObserver.observe(card);
    });

    grid.appendChild(fragment);
}

/* =========================
      FILTROS E PESQUISA (BUSCA INTELIGENTE)
========================= */
let debounceTimer;
if (pesquisaInput) {
    pesquisaInput.addEventListener("input", (e) => {
        clearTimeout(debounceTimer);
        // Normaliza a entrada do usuário
        const termo = e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

        debounceTimer = setTimeout(() => {
            const filtrados = baseDados.filter(s => {
                const nomeNormalizado = s.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const nomeMatch = nomeNormalizado.includes(termo);
                const catMatch = s.categorias.some(c => 
                    c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(termo)
                );
                return nomeMatch || catMatch;
            });
            renderizarGrid(filtrados);
            atualizarContador(filtrados.length);
        }, 250);
    });
}

function inicializarCategorias() {
    if (!categoriasContainer) return;
    const cats = [...new Set(baseDados.flatMap(s => s.categorias))].sort();
    const menuCategorias = ["Todos", ...cats];

    categoriasContainer.innerHTML = "";

    menuCategorias.forEach(cat => {
        const chip = document.createElement("button");
        chip.className = `chip ${cat === "Todos" ? "active" : ""}`;
        chip.innerHTML = `
            <span class="chip-text">${cat}</span>
            <span class="chip-count">${cat === "Todos" ? baseDados.length : baseDados.filter(s => s.categorias.includes(cat)).length}</span>
        `;

        chip.addEventListener("click", () => {
            document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            const filtrados = cat === "Todos" ? baseDados : baseDados.filter(s => s.categorias.includes(cat));
            renderizarGrid(filtrados);
            atualizarContador(filtrados.length);
        });

        categoriasContainer.appendChild(chip);
    });
}

/* =========================
      MODAL DINÂMICO
========================= */
if (!document.getElementById("santoModal")) {
    const modalHTML = `
        <div id="santoModal" class="modal-blur">
            <div class="modal-container">
                <header class="modal-nav">
                    <button class="close-modal">&times;</button>
                </header>
                <div class="modal-content-wrapper">
                    <aside class="modal-sidebar">
                        <div id="modalImg" class="modal-img-frame"></div>
                    </aside>
                    <main class="modal-main">
                        <h1 id="modalTitle"></h1>
                        <div id="modalContent" class="modal-body-text"></div>
                    </main>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

window.abrirModal = function(nomeSanto) {
    const santo = baseDados.find(s => s.nome === nomeSanto);
    if (!santo) return;

    const modal = document.getElementById("santoModal");
    const title = document.getElementById("modalTitle");
    const content = document.getElementById("modalContent");
    const imgFrame = document.getElementById("modalImg");

    // Limpa conteúdo anterior para evitar "ghosting"
    title.textContent = santo.nome;
    imgFrame.innerHTML = ""; 
    
    const nomeArquivo = santo.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-');
    imgFrame.innerHTML = `<img src="../imagens/santos/${nomeArquivo}.jpg" onerror="this.src='../imagens/default.jpg'">`;

    content.innerHTML = `
        <div class="santo-info">
            <p><strong>Vocação:</strong> ${santo.categorias.join(', ')}</p>
            <hr style="border:0; border-top:1px solid #eee; margin:20px 0;">
            <div class="biografia-texto">
                <p>A vida de <strong>${santo.nome}</strong> é um testemunho profundo para toda a Igreja Católica. 
                Sua trajetória como <em>${santo.categorias[0]}</em> inspira fiéis no mundo inteiro.</p>
                <br>
                <div style="background:#f9f9f9; padding:25px; border-left:4px solid #8b6f3d; font-style:italic; border-radius: 0 8px 8px 0;">
                    "Em breve, traremos a biografia completa e os detalhes da vida de ${santo.nome} aqui."
                </div>
            </div>
        </div>
    `;

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
};

document.addEventListener("click", (e) => {
    if (e.target.closest(".close-modal") || e.target.id === "santoModal") {
        fecharModal();
    }
});

function fecharModal() {
    const modal = document.getElementById("santoModal");
    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "auto";
    }
}

/* =========================
      INICIALIZAÇÃO FINAL
========================= */
function atualizarContador(num) {
    const contador = document.getElementById("santoContador");
    if(contador) contador.textContent = `${num} santos encontrados`;
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        renderizarGrid(baseDados);
        inicializarCategorias();
        atualizarContador(baseDados.length);
    }, 150);
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharModal();
});
