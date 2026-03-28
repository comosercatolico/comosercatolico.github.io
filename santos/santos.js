
const santos = [
  { "nome": "São Pedro", "categoria": "Apóstolo, Papa, Mártir" },
  { "nome": "São Paulo", "categoria": "Apóstolo, Mártir" },
  { "nome": "São João", "categoria": "Apóstolo, Evangelista" },
  { "nome": "São Mateus", "categoria": "Apóstolo, Evangelista, Mártir" },
  { "nome": "São Marcos", "categoria": "Evangelista, Bispo, Mártir" },
  { "nome": "São Lucas", "categoria": "Evangelista, Mártir" },
  { "nome": "Santo Estevão", "categoria": "Mártir, Diácono" },
  { "nome": "São Tiago Maior", "categoria": "Apóstolo, Mártir" },
  { "nome": "São Tiago Menor", "categoria": "Apóstolo, Mártir" },
  { "nome": "São Judas Tadeu", "categoria": "Apóstolo, Mártir" },
  { "nome": "São Bartolomeu", "categoria": "Apóstolo, Mártir" },
  { "nome": "São Simão", "categoria": "Apóstolo, Mártir" },
  { "nome": "São Tomé", "categoria": "Apóstolo, Mártir" },
  { "nome": "São Matias", "categoria": "Apóstolo, Mártir" },
  { "nome": "São Paulo da Cruz", "categoria": "Confessor, Presbítero" },
  { "nome": "São Francisco de Assis", "categoria": "Confessor, Fundador" },
  { "nome": "Santa Clara de Assis", "categoria": "Virgem, Fundadora" },
  { "nome": "Santa Teresinha do Menino Jesus", "categoria": "Doutor da Igreja, Virgem" },
  { "nome": "Santa Teresa d'Ávila", "categoria": "Doutor da Igreja, Virgem" },
  { "nome": "São João da Cruz", "categoria": "Doutor da Igreja, Presbítero" },
  { "nome": "São Tomás de Aquino", "categoria": "Doutor da Igreja, Presbítero" },
  { "nome": "São Agostinho", "categoria": "Doutor da Igreja, Bispo" },
  { "nome": "São Jerônimo", "categoria": "Doutor da Igreja, Presbítero" },
  { "nome": "São Gregório Magno", "categoria": "Doutor da Igreja, Papa" },
  { "nome": "São Basílio Magno", "categoria": "Doutor da Igreja, Bispo" },
  { "nome": "São Gregório Nazianzeno", "categoria": "Doutor da Igreja, Bispo" },
  { "nome": "São João Crisóstomo", "categoria": "Doutor da Igreja, Bispo" },
  { "nome": "São Leão Magno", "categoria": "Doutor da Igreja, Papa" },
  { "nome": "São Bento", "categoria": "Abade, Fundador" },
  { "nome": "Santa Benedita", "categoria": "Virgem, Mártir" },
  { "nome": "São Maurício", "categoria": "Mártir" },
  { "nome": "São Sebastião", "categoria": "Mártir" },
  { "nome": "São Jorge", "categoria": "Mártir" },
  { "nome": "São Lourenço", "categoria": "Mártir, Diácono" },
  { "nome": "São Vicente de Paulo", "categoria": "Confessor, Presbítero" },
  { "nome": "Santa Catarina de Sena", "categoria": "Doutor da Igreja, Virgem" },
  { "nome": "São José", "categoria": "Justo, Esposo de Maria" },
  { "nome": "Santo Antônio de Pádua", "categoria": "Doutor da Igreja, Confessor" },
  { "nome": "São João Bosco", "categoria": "Presbítero, Fundador" },
  { "nome": "São Raimundo Nonato", "categoria": "Confessor, Cardeal" },
  { "nome": "São Pio X", "categoria": "Papa" },
  { "nome": "São Gregório VII", "categoria": "Papa" },
  { "nome": "São João Paulo II", "categoria": "Papa" },
  { "nome": "São Paulo VI", "categoria": "Papa" },
  { "nome": "São Pio de Pietrelcina", "categoria": "Presbítero, Estigmatizado" },
  { "nome": "Santa Ângela de Mérici", "categoria": "Fundadora, Virgem" },
  { "nome": "Santa Paulina", "categoria": "Religiosa, Fundadora" },
  { "nome": "Santa Rita de Cássia", "categoria": "Religiosa" },
  { "nome": "São João Maria Vianney", "categoria": "Presbítero, Confessor" },
  { "nome": "São Luís Gonzaga", "categoria": "Religioso" },
  { "nome": "São Carlos Borromeu", "categoria": "Bispo" },
  { "nome": "São Francisco Xavier", "categoria": "Missionário, Presbítero" },
  { "nome": "São José de Anchieta", "categoria": "Missionário, Presbítero" },
  { "nome": "São Francisco Solano", "categoria": "Missionário, Presbítero" },
  { "nome": "Santa Rosa de Lima", "categoria": "Virgem" },
  { "nome": "Santa Maria Goretti", "categoria": "Virgem, Mártir" },
  { "nome": "Santa Faustina Kowalska", "categoria": "Religiosa" },
  { "nome": "São Maximiliano Kolbe", "categoria": "Mártir, Presbítero" },
  { "nome": "São João XXIII", "categoria": "Papa" },
  { "nome": "São Cipriano", "categoria": "Bispo, Mártir" },
  { "nome": "São Policarpo", "categoria": "Bispo, Mártir" },
  { "nome": "São Inácio de Antioquia", "categoria": "Bispo, Mártir" },
  { "nome": "São Justino Mártir", "categoria": "Mártir, Filósofo" },
  { "nome": "São Ireneu", "categoria": "Bispo, Mártir, Doutor da Igreja" },
  { "nome": "São Atanásio", "categoria": "Bispo, Doutor da Igreja" },
  { "nome": "São Cirilo de Jerusalém", "categoria": "Bispo, Doutor da Igreja" },
  { "nome": "São Metódio", "categoria": "Missionário, Bispo" },
  { "nome": "São Patrício", "categoria": "Bispo, Missionário" },
  { "nome": "Santa Brígida da Suécia", "categoria": "Religiosa, Padroeira da Europa" },
  { "nome": "Santa Edith Stein", "categoria": "Mártir, Virgem, Religiosa" },
  { "nome": "São João de Deus", "categoria": "Confessor, Fundador" },
  { "nome": "São Martinho de Tours", "categoria": "Bispo" },
  { "nome": "São Leandro", "categoria": "Bispo" },
  { "nome": "São Teotônio", "categoria": "Bispo, Confessor" },
  { "nome": "São Francisco de Sales", "categoria": "Bispo, Doutor da Igreja" },
  { "nome": "São Afonso de Ligório", "categoria": "Bispo, Doutor da Igreja" },
  { "nome": "São Antônio Maria Claret", "categoria": "Bispo, Fundador" },
  { "nome": "São Norberto", "categoria": "Bispo, Fundador" },
  { "nome": "São Bernardo de Claraval", "categoria": "Abade, Doutor da Igreja" },
  { "nome": "São Pedro Damião", "categoria": "Bispo, Doutor da Igreja" },
  { "nome": "São João Damasceno", "categoria": "Doutor da Igreja, Presbítero" },
  { "nome": "São João Batista", "categoria": "Profeta, Mártir" },
  { "nome": "São Josafá", "categoria": "Bispo, Mártir" },
  { "nome": "São Valentim", "categoria": "Mártir, Presbítero" },
  { "nome": "Santa Luzia", "categoria": "Virgem, Mártir" },
  { "nome": "Santa Ágata", "categoria": "Virgem, Mártir" },
  { "nome": "Santa Cecília", "categoria": "Virgem, Mártir" },
  { "nome": "Santa Maria Madalena", "categoria": "Penitente, Discípula" },
  { "nome": "Santa Ana", "categoria": "Justa, Mãe de Maria" },
  { "nome": "Santa Isabel da Hungria", "categoria": "Religiosa, Rainha" },
  { "nome": "Santa Margarida da Escócia", "categoria": "Rainha" },
  { "nome": "São Casimiro", "categoria": "Justo, Príncipe" },
  { "nome": "São Estanislau", "categoria": "Bispo, Mártir" },
  { "nome": "São João Nepomuceno", "categoria": "Mártir, Presbítero" },
  { "nome": "São Carlos Lwanga", "categoria": "Mártir" },
  { "nome": "Santa Josefina Bakhita", "categoria": "Religiosa" },
  { "nome": "Santa Kateri Tekakwitha", "categoria": "Virgem" },
  { "nome": "São Junípero Serra", "categoria": "Missionário, Presbítero" },
  { "nome": "São Damião de Molokai", "categoria": "Missionário, Presbítero" },
  { "nome": "Santa Dulce dos Pobres", "categoria": "Religiosa" },
  { "nome": "São Óscar Romero", "categoria": "Bispo, Mártir" },
  { "nome": "São André Kim", "categoria": "Mártir, Presbítero" },
  { "nome": "São Lourenço Ruiz", "categoria": "Mártir" },
  { "nome": "Santa Mônica", "categoria": "Confessora, Viúva" },
  { "nome": "Santa Perpétua", "categoria": "Mártir" },
  { "nome": "Santa Felicidade", "categoria": "Mártir" },
  { "nome": "Santa Blandina", "categoria": "Mártir" },
  { "nome": "São Justo", "categoria": "Mártir" },
  { "nome": "São Pastor", "categoria": "Mártir" },
  { "nome": "São Protásio", "categoria": "Mártir" },
  { "nome": "São Pancrácio", "categoria": "Mártir" },
  { "nome": "Santa Prisca", "categoria": "Virgem, Mártir" },
  { "nome": "Santa Sabina", "categoria": "Virgem, Mártir" },
  { "nome": "São Félix de Nola", categoria: "Mártir, Presbítero" },
  { "nome": "São Januário", "categoria": "Bispo, Mártir" },
  { "nome": "São Genaro", "categoria": "Bispo, Mártir" },
  { "nome": "São Frutuoso", "categoria": "Bispo, Mártir" },
  { "nome": "São Hermenegildo", "categoria": "Mártir" },
  { "nome": "Santa Ludmila", "categoria": "Rainha, Mártir" },
  { "nome": "Santa Adelaide", "categoria": "Imperatriz" },
  { "nome": "Santa Cunegundes", "categoria": "Imperatriz" },
  { "nome": "São Fernando III", "categoria": "Rei" },
  { "nome": "São Nicolau", "categoria": "Bispo" },
  { "nome": "São Cosme", "categoria": "Mártir" },
  { "nome": "São Damião", "categoria": "Mártir" },
  { "nome": "São Roque", "categoria": "Confessor" },
  { "nome": "São Cristóvão", "categoria": "Mártir" },
  { "nome": "Santa Inês", "categoria": "Virgem, Mártir" },
  { "nome": "Santa Marta", "categoria": "Confessora, Virgem" },
  { "nome": "São Joaquim", "categoria": "Justo, Pai de Maria" },
  { "nome": "São Zacarias", "categoria": "Profeta, Mártir" },
  { "nome": "Santa Isabel", "categoria": "Justa" },
  { "nome": "São Filipe", "categoria": "Apóstolo, Mártir" },
  { "nome": "São André", "categoria": "Apóstolo, Mártir" },
  { "nome": "São Hilário de Poitiers", "categoria": "Bispo, Doutor da Igreja" },
  { "nome": "São Efrém", "categoria": "Doutor da Igreja, Diácono" },
  { "nome": "São Beda, o Venerável", "categoria": "Doutor da Igreja, Monge" },
  { "nome": "São Bruno", "categoria": "Religioso, Fundador" },
  { "nome": "São Pedro Canísio", "categoria": "Bispo, Doutor da Igreja" },
  { "nome": "São Leonardo de Porto Maurício", "categoria": "Presbítero" },
  { "nome": "São Pedro Julião Eymard", "categoria": "Presbítero, Fundador" },
  { "nome": "São João Eudes", "categoria": "Presbítero, Fundador" },
  { "nome": "São Luís Maria Grignion de Montfort", "categoria": "Presbítero, Missionário" },
  { "nome": "São Roque González", "categoria": "Missionário, Mártir" },
  { "nome": "São Turíbio de Mongrovejo", "categoria": "Bispo" },
  { "nome": "São Martinho de Lima", "categoria": "Religioso" },
  { "nome": "Santa Mariana de Jesus", "categoria": "Virgem" },
  { "nome": "Santa Teresa dos Andes", "categoria": "Virgem, Religiosa" },
  { "nome": "São Alberto Magno", "categoria": "Doutor da Igreja, Bispo" },
  { "nome": "Santa Hildegarda de Bingen", "categoria": "Doutor da Igreja, Virgem" },
  { "nome": "Santa Matilde", "categoria": "Rainha" },
  { "nome": "Santa Gertrudes", "categoria": "Virgem, Mística" },
  { "nome": "Santa Escolástica", "categoria": "Virgem" },
  { "nome": "São Romualdo", "categoria": "Abade" },
  { "nome": "São Columbano", "categoria": "Abade" },
  { "nome": "São Bonifácio", "categoria": "Bispo, Mártir" },
  { "nome": "São Willibrordo", "categoria": "Bispo" },
  { "nome": "São Venceslau", "categoria": "Rei, Mártir" },
  { "nome": "São Henrique II", "categoria": "Rei" },
  { "nome": "São Adalberto", "categoria": "Bispo, Mártir" },
  { "nome": "São Bruno de Querfurt", "categoria": "Bispo, Mártir" },
  { "nome": "São Paulo Chong", "categoria": "Mártir" },
  { "nome": "Santa Helena", "categoria": "Imperatriz" },
  { "nome": "São Gervásio", "categoria": "Mártir" },
  { "nome": "São Vital", "categoria": "Mártir" },
  { "nome": "Santa Valéria", "categoria": "Virgem, Mártir" },
  { "nome": "São Narciso", "categoria": "Bispo" },
  { "nome": "São Quadrato", "categoria": "Bispo" },
  { "nome": "São Tarcísio", "categoria": "Mártir, Acólito" },
  { "nome": "São Severo", "categoria": "Bispo" },
  { "nome": "São Isidoro de Sevilha", "categoria": "Doutor da Igreja, Bispo" },
  { "nome": "São Ildefonso", "categoria": "Bispo" },
  { "nome": "São Gonçalo", "categoria": "Confessor, Presbítero" },
  { "nome": "São Nuno de Santa Maria", "categoria": "Confessor, Religioso" },
  { "nome": "Santa Beatriz da Silva", "categoria": "Religiosa, Fundadora" },
  { "nome": "Santa Joana de Portugal", "categoria": "Virgem" },
  { "nome": "São Frei Galvão", "categoria": "Presbítero" },
  { "nome": "São José Moscati", "categoria": "Confessor, Médico" },
  { "nome": "São Ricardo Pampuri", "categoria": "Presbítero, Médico" },
  { "nome": "Santa Maria Bertilla", "categoria": "Religiosa" },
  { "nome": "Santa Paula Frassinetti", "categoria": "Religiosa, Fundadora" },
  { "nome": "São Luís Orione", "categoria": "Presbítero, Fundador" },
  { "nome": "São João Calabria", "categoria": "Presbítero, Fundador" },
  { "nome": "São Vicente Pallotti", "categoria": "Presbítero, Fundador" },
  { "nome": "São Gaspar del Búfalo", "categoria": "Presbítero, Fundador" },
  { "nome": "São Camilo de Lellis", "categoria": "Presbítero, Fundador" },
  { "nome": "São Pantaleão", "categoria": "Mártir, Médico" },
  { "nome": "Santa Bárbara", "categoria": "Virgem, Mártir" },
  { "nome": "São Brás", "categoria": "Bispo, Mártir" },
  { "nome": "São Charbel Makhlouf", "categoria": "Presbítero, Monge" },
  { "nome": "São Bento José Labre", "categoria": "Confessor" },
  { "nome": "Santa Bernadette Soubirous", "categoria": "Virgem" },
  { "nome": "São Domingos de Gusmão", "categoria": "Presbítero, Fundador" },
  { "nome": "Santa Catarina de Alexandria", "categoria": "Virgem, Mártir" },
  { "nome": "São Francisco de Paula", "categoria": "Eremita, Fundador" },
  { "nome": "São Boaventura", "categoria": "Bispo, Doutor da Igreja" },
  { "nome": "São João da Calcedônia", "categoria": "Bispo, Mártir" },
  { "nome": "Santa Teresa de Calcutá", "categoria": "Religiosa, Fundadora" },
  { "nome": "São José Maria Escrivá", "categoria": "Presbítero, Fundador" },
  { "nome": "São Rafael Guízar e Valencia", "categoria": "Bispo" },
  { "nome": "São Miguel Febres Cordero", "categoria": "Religioso" },
  { "nome": "São João de Brito", "categoria": "Missionário, Mártir" },
  { "nome": "São Pedro Claver", "categoria": "Missionário, Presbítero" },
  { "nome": "São Daniel Comboni", "categoria": "Bispo, Missionário" },
  { "nome": "Santa Maria MacKillop", "categoria": "Religiosa, Fundadora" },
  { "nome": "São Pedro Chanel", "categoria": "Missionário, Mártir" },
  { "nome": "São Longuinho", "categoria": "Mártir" },
  { "nome": "São Dimas", "categoria": "Justo, Bom Ladrão" },
  { "nome": "São Lázaro", "categoria": "Justo, Bispo" },
  { "nome": "Santa Verônica", "categoria": "Justa" },
  { "nome": "São Barnabé", "categoria": "Apóstolo" },
  { "nome": "São Timóteo", "categoria": "Bispo, Mártir" },
  { "nome": "São Tito", "categoria": "Bispo" },
  { "nome": "São Lucas da Crimeia", "categoria": "Bispo, Médico" },
  { "nome": "São João de Kronstadt", "categoria": "Presbítero" },
  { "nome": "São Serafim de Sarov", "categoria": "Monge, Místico" },
  { "nome": "São Silvestre I", "categoria": "Papa" },
  { "nome": "São Dâmaso I", "categoria": "Papa" },
  { "nome": "São Fabiano", "categoria": "Papa, Mártir" },
  { "nome": "São Cornélio", "categoria": "Papa, Mártir" },
  { "nome": "São Calixto I", "categoria": "Papa, Mártir" },
  { "nome": "São Ponciano", "categoria": "Papa, Mártir" },
  { "nome": "São Sisto II", "categoria": "Papa, Mártir" },
  { "nome": "São Clemente I", "categoria": "Papa, Mártir" },
  { "nome": "Santa Inês de Praga", "categoria": "Virgem, Religiosa" },
  { "nome": "São João de Capistrano", "categoria": "Presbítero" },
  { "nome": "São Tiago de Marca", "categoria": "Presbítero" },
  { "nome": "São Pascoal Bailão", "categoria": "Religioso" },
  { "nome": "São Bernardino de Sena", "categoria": "Presbítero" },
  { "nome": "Santa Coleta", "categoria": "Virgem, Religiosa" },
  { "nome": "São Diogo de Alcalá", "categoria": "Religioso" },
  { "nome": "São Pedro de Alcântara", "categoria": "Presbítero, Confessor" },
  { "nome": "São Carlos de Sezze", "categoria": "Religioso" },
  { "nome": "São Crispim de Viterbo", "categoria": "Religioso" },
  { "nome": "São João José da Cruz", "categoria": "Presbítero" },
  { "nome": "São Egídio Maria de São José", "categoria": "Religioso" },
  { "nome": "São Conrado de Parzham", "categoria": "Religioso" },
  { "nome": "São Leopoldo Mandic", "categoria": "Presbítero" },
  { "nome": "São Nicolau de Flüe", "categoria": "Eremita" },
  { "nome": "São Cláudio de la Colombière", "categoria": "Presbítero" },
  { "nome": "Santa Margarida Maria Alacoque", "categoria": "Virgem, Religiosa" },
  { "nome": "São Francisco de Borja", "categoria": "Presbítero" },
  { "nome": "São Luís Beltrão", "categoria": "Missionário" },
  { "nome": "São João de Castilho", "categoria": "Missionário, Mártir" },
  { "nome": "São Afonso Rodrigues", "categoria": "Religioso" },
  { "nome": "São Roberto Belarmino", "categoria": "Bispo, Doutor da Igreja" },
  { "nome": "São Pedro Canísio", "categoria": "Doutor da Igreja, Presbítero" },
  { "nome": "São Estanislau Kostka", "categoria": "Religioso" },
  { "nome": "São João Berchmans", "categoria": "Religioso" },
  { "nome": "São Paulo Miki", "categoria": "Mártir" },
  { "nome": "São João de Brito", "categoria": "Missionário, Mártir" },
  { "nome": "São Melchior Cano", "categoria": "Bispo" },
  { "nome": "São Pedro de Arbués", "categoria": "Mártir" },
  { "nome": "Santa Zita", "categoria": "Justa, Virgem" },
  { "nome": "São João de Sahagún", "categoria": "Presbítero" },
  { "nome": "São Tomás de Vilanova", "categoria": "Bispo" },
  { "nome": "São João de Facundo", "categoria": "Presbítero" },
  { "nome": "São Nicolau Tolentino", "categoria": "Presbítero" },
  { "nome": "Santa Rita de Cássia", "categoria": "Religiosa, Viúva" },
  { "nome": "São João de Kanty", "categoria": "Presbítero" },
  { "nome": "Santa Eduviges", "categoria": "Religiosa, Rainha" },
  { "nome": "São Jacinto", "categoria": "Presbítero" },
  { "nome": "São Vicente Ferrer", "categoria": "Presbítero" },
  { "nome": "São Pedro de Verona", "categoria": "Mártir" },
  { "nome": "São Raimundo de Penaforte", "categoria": "Presbítero" },
  { "nome": "São Pio V", "categoria": "Papa" },
  { "nome": "Santo Antonino de Florença", "categoria": "Bispo" },
  { "nome": "São Luís de França", "categoria": "Rei, Justo" },
  { "nome": "Santa Isabel de Portugal", "categoria": "Rainha, Justa" },
  { "nome": "São Roque", "categoria": "Confessor, Peregrino" },
  { "nome": "São Ivo", "categoria": "Presbítero, Justo" },
  { "nome": "Santa Catarina de Bolonha", "categoria": "Virgem" },
  { "nome": "São João de Ribera", "categoria": "Bispo" },
  { "nome": "São Pascoal Baylon", "categoria": "Religioso" },
  { "nome": "Santa Rosa de Viterbo", "categoria": "Virgem" },
  { "nome": "São Boaventura de Potenza", "categoria": "Presbítero" },
  { "nome": "São Geraldo Majella", "categoria": "Religioso" },
  { "nome": "São Clemente Maria Hofbauer", "categoria": "Presbítero" },
  { "nome": "São João Neumann", "categoria": "Bispo" },
  { "nome": "São Pedro Fourier", "categoria": "Presbítero" },
  { "nome": "São João Batista de La Salle", "categoria": "Presbítero, Fundador" },
  { "nome": "Santa Genoveva", "categoria": "Virgem" },
  { "nome": "São Germano de Paris", "categoria": "Bispo" },
  { "nome": "São Remígio", "categoria": "Bispo" },
  { "nome": "São Dionísio", "categoria": "Bispo, Mártir" },
  { "nome": "São Hilário de Arles", "categoria": "Bispo" },
  { "nome": "São Cesário de Arles", "categoria": "Bispo" },
  { "nome": "São Gregório de Tours", "categoria": "Bispo" },
  { "nome": "São Martinho de Braga", "categoria": "Bispo" },
  { "nome": "São Frutuoso de Braga", "categoria": "Bispo" },
  { "nome": "São Geraldo de Braga", "categoria": "Bispo" },
  { "nome": "São Paio", "categoria": "Mártir" },
  { "nome": "Santa Engrácia", "categoria": "Virgem, Mártir" },
  { "nome": "São Vicente de Huesca", "categoria": "Diácono, Mártir" },
  { "nome": "São Valério de Saragoça", "categoria": "Bispo" },
  { "nome": "São Bráulio de Saragoça", "categoria": "Bispo" },
  { "nome": "São Prudêncio", "categoria": "Bispo" },
  { "nome": "São Millán", "categoria": "Abade" },
  { "nome": "São Domingos de Silos", "categoria": "Abade" },
  { "nome": "São João de Ortega", "categoria": "Presbítero" },
  { "nome": "São Pedro de Rates", "categoria": "Bispo, Mártir" },
  { "nome": "Santa Marinha", "categoria": "Virgem, Mártir" },
  { "nome": "São Rosendo", "categoria": "Bispo" },
  { "nome": "São Froilán", "categoria": "Bispo" },
  { "nome": "São Átila", "categoria": "Bispo" },
  { "nome": "São Genádio", "categoria": "Bispo" },
  { "nome": "São Veríssimo", "categoria": "Mártir" },
  { "nome": "São Máximo Confessor", "categoria": "Abade, Doutor da Igreja" },
  { "nome": "São Simeão Estilita", "categoria": "Eremita" },
  { "nome": "São Macário o Grande", "categoria": "Abade" },
  { "nome": "São Pacômio", "categoria": "Abade" },
  { "nome": "São Paulo de Tebas", "categoria": "Eremita" },
  { "nome": "Santo Antão do Deserto", "categoria": "Abade, Eremita" },
  { "nome": "São Cosme de Maiuma", "categoria": "Bispo" },
  { "nome": "São Teodoro Estudita", "categoria": "Abade" },
  { "nome": "São Gregório Palamas", "categoria": "Bispo" },
  { "nome": "São Serapião", "categoria": "Bispo" },
  { "nome": "São Pafnúcio", "categoria": "Bispo" },
  { "nome": "São Policarpo de Esmirna", "categoria": "Bispo, Mártir" },
  { "nome": "São Babila", "categoria": "Bispo, Mártir" },
  { "nome": "São Luciano de Antioquia", "categoria": "Mártir" },
  { "nome": "São Pedro de Alexandria", "categoria": "Bispo, Mártir" },
  { "nome": "São Cirilo de Alexandria", "categoria": "Bispo, Doutor da Igreja" },
  { "nome": "São Pedro Crisólogo", "categoria": "Bispo, Doutor da Igreja" },
  { "nome": "São Paulino de Nola", "categoria": "Bispo" },
  { "nome": "São Sulpício Severo", "categoria": "Presbítero" },
  { "nome": "São Sidônio Apolinário", "categoria": "Bispo" },
  { "nome": "São Venâncio Fortunato", "categoria": "Bispo" },
  { "nome": "São Columba de Iona", "categoria": "Abade" },
  { "nome": "São Kevin", "categoria": "Abade" },
  { "nome": "São Brendano", "categoria": "Abade" },
  { "nome": "São David de Gales", "categoria": "Bispo" },
  { "nome": "Santo Anselmo de Cantuária", "categoria": "Bispo, Doutor da Igreja" },
  { "nome": "São Tomás Becket", "categoria": "Bispo, Mártir" },
  { "nome": "São Ricardo de Chichester", "categoria": "Bispo" },
  { "nome": "São Hugo de Lincoln", "categoria": "Bispo" },
  { "nome": "São Gilberto de Sempringham", "categoria": "Fundador" },
  { "nome": "São Simão Stock", "categoria": "Religioso" },
  { "nome": "São João Houghton", "categoria": "Mártir" },
  { "nome": "São Roberto Southwell", "categoria": "Mártir, Presbítero" },
  { "nome": "São Edmundo Campion", "categoria": "Mártir, Presbítero" },
  { "nome": "São Nicolau Owen", "categoria": "Mártir" },
  { "nome": "São João Ogilvie", "categoria": "Mártir" },
  { "nome": "São Fidelis de Sigmaringa", "categoria": "Mártir, Presbítero" },
  { "nome": "São Josafat Kuncewicz", "categoria": "Bispo, Mártir" },
  { "nome": "São Sigismundo", "categoria": "Rei, Mártir" },
  { "nome": "São Canuto", "categoria": "Rei, Mártir" },
  { "nome": "São Olavo", "categoria": "Rei, Mártir" },
  { "nome": "Santo Estêvão da Hungria", "categoria": "Rei" },
  { "nome": "São Ladislau", "categoria": "Rei" },
  { "nome": "São Leopoldo III", "categoria": "Marquês" },
  { "nome": "Santa Cunegunda", "categoria": "Imperatriz, Virgem" },
  { "nome": "São Pedro de Alcântara", "categoria": "Presbítero, Confessor" },
  { "nome": "São João Batista de la Salle", "categoria": "Presbítero, Fundador" },
  { "nome": "São Felipe Neri", "categoria": "Presbítero, Fundador" },
  { "nome": "São Caetano", "categoria": "Presbítero, Fundador" },
  { "nome": "São Jerônimo Emiliani", "categoria": "Presbítero, Fundador" },
  { "nome": "São Camilo de Lellis", "categoria": "Presbítero, Fundador" },
  { "nome": "São José de Calasanz", "categoria": "Presbítero, Fundador" },
  { "nome": "São Paulo da Cruz", "categoria": "Presbítero, Fundador" },
  { "nome": "São Vicente Strambi", "categoria": "Bispo" },
  { "nome": "São Pompílio Maria Pirrotti", "categoria": "Presbítero" },
  { "nome": "São Francisco Maria da Camporosso", "categoria": "Religioso" },
  { "nome": "São João Batista de Rossi", "categoria": "Presbítero" },
  { "nome": "São Benedito, o Mouro", "categoria": "Religioso" },
  { "nome": "Santa Francisca Romana", "categoria": "Religiosa" },
  { "nome": "Santa Catarina de Gênova", "categoria": "Mística" },
  { "nome": "Santa Maria Madalena de Pazzi", "categoria": "Virgem" },
  { "nome": "Santa Verônica Giuliani", "categoria": "Virgem" },
  { "nome": "São Paulo VI", "categoria": "Papa" },
  { "nome": "São João Paulo II", "categoria": "Papa" },
  { "nome": "Santa Gema Galgani", "categoria": "Virgem, Mística" },
  { "nome": "Santa Maria de Mattias", "categoria": "Religiosa" },
  { "nome": "São João Calábria", "categoria": "Presbítero" },
  { "nome": "São Tiago Alberione", "categoria": "Presbítero, Fundador" },
  { "nome": "São Josemaria Escrivá", "categoria": "Presbítero, Fundador" },
  { "nome": "São Pio de Pietrelcina", "categoria": "Presbítero, Confessor" },
  { "nome": "Santa Teresa Benedita da Cruz", "categoria": "Mártir, Doutor da Igreja" },
  { "nome": "Santa Maria Faustina Kowalska", "categoria": "Religiosa, Mística" }
];

const grid = document.getElementById("santosGrid");
const pesquisaInput = document.querySelector(".santos-pesquisa input");
const categoriasContainer = document.getElementById("categoriasContainer");

/* =========================
      MOTOR DE RENDERIZAÇÃO
========================= */

function renderizarGrid(lista) {
    // Limpa o grid de forma performática
    grid.innerHTML = "";
    
    // DocumentFragment evita múltiplos reflows no navegador
    const fragment = document.createDocumentFragment();

    lista.forEach(santo => {
        const card = document.createElement("div");
        card.className = "santo-card animate-in"; // Classe para animação CSS
        
        // Sanitização simples para IDs e classes
        const categoriaLimpa = santo.categoria.split(',')[0].trim();

        card.innerHTML = `
            <div class="santo-badge">${categoriaLimpa}</div>
            <img src="../imagens/santos/${santo.nome.toLowerCase().replace(/ /g, '-')}.jpg" 
                 onerror="this.src='../imagens/default.jpg'" 
                 alt="${santo.nome}" loading="lazy">
            <div class="santo-card-content">
                <h3>${santo.nome}</h3>
                <p>Conheça a história e o legado de fé de ${santo.nome}.</p>
                <button class="btn-ler" onclick="abrirModal('${santo.nome.replace(/'/g, "\\'")}')">
                    Ler Vida <i class="fas fa-book-open"></i>
                </button>
            </div>
        `;
        fragment.appendChild(card);
    });

    grid.appendChild(fragment);
}

/* =========================
      FILTROS E PESQUISA
========================= */

// Pesquisa com "Debounce" (espera o usuário parar de digitar para processar)
let timeoutPesquisa;
pesquisaInput.addEventListener("input", () => {
    clearTimeout(timeoutPesquisa);
    timeoutPesquisa = setTimeout(() => {
        const termo = pesquisaInput.value.toLowerCase();
        const filtrados = santos.filter(s => 
            s.nome.toLowerCase().includes(termo) || 
            s.categoria.toLowerCase().includes(termo)
        );
        renderizarGrid(filtrados);
    }, 300);
});

// Gerador de Botões de Categoria Inteligente
function inicializarCategorias() {
    // Pega todas as categorias individuais, remove duplicatas e ordena
    const todasCategorias = santos.flatMap(s => s.categoria.split(',').map(c => c.trim()));
    const categoriasUnicas = ["Todos", ...new Set(todasCategorias)].sort();

    categoriasUnicas.forEach(cat => {
        const btn = document.createElement("button");
        btn.textContent = cat;
        btn.className = cat === "Todos" ? "categoria-btn active" : "categoria-btn";

        btn.addEventListener("click", () => {
            document.querySelectorAll(".categoria-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const filtrados = cat === "Todos" 
                ? santos 
                : santos.filter(s => s.categoria.includes(cat));
            
            renderizarGrid(filtrados);
        });

        categoriasContainer.appendChild(btn);
    });
}

/* =========================
      MODAL REFORMULADO
========================= */

// Criar estrutura do modal dinamicamente (melhor que ter no HTML fixo)
const estruturaModal = `
    <div id="santoModal" class="modal-overlay">
        <div class="modal-box">
            <button class="modal-close">&times;</button>
            <div class="modal-body">
                <div class="modal-header-img"></div>
                <h2 id="modalTitle"></h2>
                <div id="modalContent" class="modal-scroll-area">
                    <div class="loading-skeleton"></div>
                </div>
            </div>
        </div>
    </div>
`;
document.body.insertAdjacentHTML('beforeend', estruturaModal);

const modalElement = document.getElementById("santoModal");

window.abrirModal = function(nomeSanto) {
    const santo = santos.find(s => s.nome === nomeSanto);
    if (!santo) return;

    const modalTitle = document.getElementById("modalTitle");
    const modalContent = document.getElementById("modalContent");
    
    modalTitle.textContent = santo.nome;
    modalElement.classList.add("active");
    document.body.style.overflow = "hidden"; 

    // Conteúdo Dinâmico
    modalContent.innerHTML = `
        <div class="santo-detalhe">
            <img src="../imagens/santos/${santo.nome.toLowerCase().replace(/ /g, '-')}.jpg" 
                 onerror="this.style.display='none'" 
                 style="width:100%; max-height:300px; object-fit:cover; border-radius:10px; margin-bottom:20px;">
            
            <p><strong>Vocação:</strong> ${santo.categoria}</p>
            <hr style="border:0; border-top:1px solid #eee; margin:20px 0;">
            
            <div class="biografia-texto">
                <p>A vida de <strong>${santo.nome}</strong> é um testemunho profundo para toda a Igreja Católica. 
                Sua trajetória dentro da categoria de <em>${santo.categoria}</em> inspira fiéis no mundo inteiro.</p>
                
                <br>
                <div style="background:#f9f9f9; padding:20px; border-left:4px solid #8b6f3d; font-style:italic;">
                    "Sem conteúdo por aqui no momento. Estamos trabalhando para trazer a biografia completa deste santo em breve."
                </div>
            </div>
        </div>
    `;
};

// Fechar Modal
document.querySelector(".modal-close").addEventListener("click", fecharModal);
modalElement.addEventListener("click", e => e.target === modalElement && fecharModal());

function fecharModal() {
    modalElement.classList.remove("active");
    document.body.style.overflow = "auto";
}

/* =========================
      INICIALIZAÇÃO
========================= */

document.addEventListener("DOMContentLoaded", () => {
    renderizarGrid(santos);
    inicializarCategorias();
});
