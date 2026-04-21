
// Question bank for Heto trivia game
// 40+ questions across all categories and tiers

const questionsData = [
  // GEOGRAPHY - GASHA (Easy)
  {
    id: 'geo-gasha-1',
    question: 'What is the capital city of Eritrea?',
    options: ['Asmara', 'Massawa', 'Keren', 'Assab'],
    correct: 'A',
    explanation: 'Asmara is the capital and largest city of Eritrea, known for its well-preserved Italian colonial architecture.',
    category: 'Geography',
    tier: 'gasha'
  },
  {
    id: 'geo-gasha-2',
    question: 'Which sea borders Eritrea to the east?',
    options: ['Mediterranean Sea', 'Red Sea', 'Arabian Sea', 'Dead Sea'],
    correct: 'B',
    explanation: 'The Red Sea borders Eritrea to the east, providing access to important shipping routes.',
    category: 'Geography',
    tier: 'gasha'
  },
  {
    id: 'geo-gasha-3',
    question: 'Which country does NOT border Eritrea?',
    options: ['Sudan', 'Ethiopia', 'Djibouti', 'Somalia'],
    correct: 'D',
    explanation: 'Eritrea borders Sudan, Ethiopia, and Djibouti, but not Somalia.',
    category: 'Geography',
    tier: 'gasha'
  },
  {
    id: 'geo-gasha-4',
    question: 'What is the main port city of Eritrea?',
    options: ['Asmara', 'Massawa', 'Keren', 'Mendefera'],
    correct: 'B',
    explanation: 'Massawa is the main port city of Eritrea, located on the Red Sea coast.',
    category: 'Geography',
    tier: 'gasha'
  },

  // GEOGRAPHY - QOLA (Medium)
  {
    id: 'geo-qola-1',
    question: 'What is the highest mountain in Eritrea?',
    options: ['Mount Soira', 'Emba Soira', 'Mount Asmara', 'Ras Dashen'],
    correct: 'B',
    explanation: 'Emba Soira is the highest mountain in Eritrea at 3,018 meters above sea level.',
    category: 'Geography',
    tier: 'qola'
  },
  {
    id: 'geo-qola-2',
    question: 'How many islands does Eritrea have in the Dahlak Archipelago?',
    options: ['About 50', 'About 100', 'About 200', 'About 350'],
    correct: 'D',
    explanation: 'The Dahlak Archipelago consists of about 350 islands in the Red Sea.',
    category: 'Geography',
    tier: 'qola'
  },

  // GEOGRAPHY - GOBEZ (Hard)
  {
    id: 'geo-gobez-1',
    question: 'What is the approximate length of Eritrea\'s coastline?',
    options: ['500 km', '1,000 km', '1,200 km', '1,500 km'],
    correct: 'C',
    explanation: 'Eritrea has approximately 1,200 kilometers of coastline along the Red Sea.',
    category: 'Geography',
    tier: 'gobez'
  },

  // HISTORY - GASHA (Easy)
  {
    id: 'hist-gasha-1',
    question: 'In what year did Eritrea gain independence?',
    options: ['1991', '1993', '1995', '1998'],
    correct: 'B',
    explanation: 'Eritrea officially gained independence on May 24, 1993, after a referendum.',
    category: 'History',
    tier: 'gasha'
  },
  {
    id: 'hist-gasha-2',
    question: 'Which European country colonized Eritrea?',
    options: ['Britain', 'France', 'Italy', 'Portugal'],
    correct: 'C',
    explanation: 'Italy colonized Eritrea from 1890 to 1941, leaving significant architectural influence.',
    category: 'History',
    tier: 'gasha'
  },
  {
    id: 'hist-gasha-3',
    question: 'What is celebrated on May 24th in Eritrea?',
    options: ['New Year', 'Independence Day', 'Revolution Day', 'Unity Day'],
    correct: 'B',
    explanation: 'May 24th is Eritrea\'s Independence Day, commemorating independence in 1993.',
    category: 'History',
    tier: 'gasha'
  },

  // HISTORY - QOLA (Medium)
  {
    id: 'hist-qola-1',
    question: 'How long did the Eritrean War of Independence last?',
    options: ['20 years', '25 years', '30 years', '35 years'],
    correct: 'C',
    explanation: 'The Eritrean War of Independence lasted 30 years, from 1961 to 1991.',
    category: 'History',
    tier: 'qola'
  },
  {
    id: 'hist-qola-2',
    question: 'Which ancient kingdom included parts of modern-day Eritrea?',
    options: ['Kingdom of Kush', 'Kingdom of Aksum', 'Kingdom of Sheba', 'Kingdom of Nubia'],
    correct: 'B',
    explanation: 'The Kingdom of Aksum, one of the great civilizations of the ancient world, included parts of Eritrea.',
    category: 'History',
    tier: 'qola'
  },

  // HISTORY - GOBEZ (Hard)
  {
    id: 'hist-gobez-1',
    question: 'Where are the ancient Stelae of Aksum located in Eritrea?',
    options: ['Asmara', 'Massawa', 'Matara', 'Keren'],
    correct: 'C',
    explanation: 'The ancient archaeological site of Matara contains important Aksumite ruins and stelae.',
    category: 'History',
    tier: 'gobez'
  },
  {
    id: 'hist-gobez-2',
    question: 'What year did the Battle of Adwa take place, involving Eritrean forces?',
    options: ['1889', '1896', '1900', '1905'],
    correct: 'B',
    explanation: 'The Battle of Adwa occurred in 1896, a significant event in the region\'s history.',
    category: 'History',
    tier: 'gobez'
  },

  // CULTURE & TRADITIONS - GASHA (Easy)
  {
    id: 'cult-gasha-1',
    question: 'What is the traditional Eritrean flatbread called?',
    options: ['Naan', 'Pita', 'Injera', 'Chapati'],
    correct: 'C',
    explanation: 'Injera is the traditional spongy flatbread made from teff flour, central to Eritrean cuisine.',
    category: 'Culture & Traditions',
    tier: 'gasha'
  },
  {
    id: 'cult-gasha-2',
    question: 'What is the traditional coffee ceremony called in Tigrinya?',
    options: ['Buna', 'Kahwa', 'Qahwa', 'Kafe'],
    correct: 'A',
    explanation: 'Buna is the Tigrinya word for coffee, and the coffee ceremony is an important cultural tradition.',
    category: 'Culture & Traditions',
    tier: 'gasha'
  },
  {
    id: 'cult-gasha-3',
    question: 'What is the traditional white dress worn by Eritrean women called?',
    options: ['Sari', 'Zuria', 'Kaftan', 'Abaya'],
    correct: 'B',
    explanation: 'The Zuria is the traditional white cotton dress with colorful embroidered borders worn by Eritrean women.',
    category: 'Culture & Traditions',
    tier: 'gasha'
  },

  // CULTURE & TRADITIONS - QOLA (Medium)
  {
    id: 'cult-qola-1',
    question: 'What is the name of the traditional Eritrean shoulder dance?',
    options: ['Guayla', 'Eskista', 'Kuda', 'Tigrigna'],
    correct: 'A',
    explanation: 'Guayla is the traditional shoulder dance performed at celebrations and gatherings.',
    category: 'Culture & Traditions',
    tier: 'qola'
  },
  {
    id: 'cult-qola-2',
    question: 'What grain is traditionally used to make injera?',
    options: ['Wheat', 'Barley', 'Teff', 'Millet'],
    correct: 'C',
    explanation: 'Teff is the traditional grain used to make injera, though other grains can be used.',
    category: 'Culture & Traditions',
    tier: 'qola'
  },

  // CULTURE & TRADITIONS - GOBEZ (Hard)
  {
    id: 'cult-gobez-1',
    question: 'What is the traditional Eritrean stew with berbere spice called?',
    options: ['Tsebhi', 'Zigni', 'Alicha', 'Kitfo'],
    correct: 'B',
    explanation: 'Zigni is the spicy meat stew made with berbere spice, a staple of Eritrean cuisine.',
    category: 'Culture & Traditions',
    tier: 'gobez'
  },

  // LANGUAGE - GASHA (Easy)
  {
    id: 'lang-gasha-1',
    question: 'What does "Selam" mean in Tigrinya?',
    options: ['Goodbye', 'Hello/Peace', 'Thank you', 'Please'],
    correct: 'B',
    explanation: 'Selam means both "hello" and "peace" in Tigrinya, used as a common greeting.',
    category: 'Language',
    tier: 'gasha'
  },
  {
    id: 'lang-gasha-2',
    question: 'What script is used to write Tigrinya?',
    options: ['Latin', 'Arabic', 'Ge\'ez', 'Cyrillic'],
    correct: 'C',
    explanation: 'Tigrinya is written using the Ge\'ez script, an ancient Semitic writing system.',
    category: 'Language',
    tier: 'gasha'
  },
  {
    id: 'lang-gasha-3',
    question: 'How do you say "thank you" in Tigrinya?',
    options: ['Selam', 'Yekenyeley', 'Dehando', 'Ameseginaleo'],
    correct: 'D',
    explanation: 'Ameseginaleo (or Yeqenyeley) means "thank you" in Tigrinya.',
    category: 'Language',
    tier: 'gasha'
  },

  // LANGUAGE - QOLA (Medium)
  {
    id: 'lang-qola-1',
    question: 'What does "Tigrinya" literally mean?',
    options: ['Language of the people', 'Language of Tigray', 'Ancient language', 'Sacred language'],
    correct: 'B',
    explanation: 'Tigrinya means "language of Tigray," referring to the Tigray-Tigrinya people.',
    category: 'Language',
    tier: 'qola'
  },
  {
    id: 'lang-qola-2',
    question: 'How many official languages does Eritrea have?',
    options: ['1', '3', '9', 'No official language'],
    correct: 'D',
    explanation: 'Eritrea has no official language, though Tigrinya, Arabic, and English are widely used.',
    category: 'Language',
    tier: 'qola'
  },

  // LANGUAGE - GOBEZ (Hard)
  {
    id: 'lang-gobez-1',
    question: 'What is the word for "mother" in Tigrinya?',
    options: ['Abo', 'Adey', 'Habo', 'Emaye'],
    correct: 'B',
    explanation: 'Adey (ኣደይ) means "mother" in Tigrinya, while Abo means "father".',
    category: 'Language',
    tier: 'gobez'
  },

  // MUSIC & ART - GASHA (Easy)
  {
    id: 'music-gasha-1',
    question: 'Who is known as the "Eritrean King of Music"?',
    options: ['Yemane Barya', 'Abraham Afewerki', 'Alamin Abdeletif', 'Bereket Mengisteab'],
    correct: 'A',
    explanation: 'Yemane Barya (Yemane Ghebremichael) is known as the "Eritrean King of Music" and cultural icon.',
    category: 'Music & Art',
    tier: 'gasha'
  },
  {
    id: 'music-gasha-2',
    question: 'What is the traditional Eritrean string instrument called?',
    options: ['Oud', 'Krar', 'Sitar', 'Lyre'],
    correct: 'B',
    explanation: 'The Krar is a traditional five or six-stringed lyre used in Eritrean music.',
    category: 'Music & Art',
    tier: 'gasha'
  },

  // MUSIC & ART - QOLA (Medium)
  {
    id: 'music-qola-1',
    question: 'What is the traditional Eritrean one-stringed instrument called?',
    options: ['Masenqo', 'Kebero', 'Washint', 'Begena'],
    correct: 'A',
    explanation: 'The Masenqo is a traditional one-stringed bowed instrument used in Eritrean music.',
    category: 'Music & Art',
    tier: 'qola'
  },
  {
    id: 'music-qola-2',
    question: 'Which famous Eritrean singer is known for the song "Shigey Habuni"?',
    options: ['Helen Meles', 'Faytinga', 'Dehab Faytinga', 'Yemane Barya'],
    correct: 'D',
    explanation: 'Yemane Barya is famous for many songs including "Shigey Habuni".',
    category: 'Music & Art',
    tier: 'qola'
  },

  // MUSIC & ART - GOBEZ (Hard)
  {
    id: 'music-gobez-1',
    question: 'What is the traditional Eritrean drum used in religious ceremonies?',
    options: ['Djembe', 'Kebero', 'Tabla', 'Darbuka'],
    correct: 'B',
    explanation: 'The Kebero is a large double-headed drum used in Orthodox Christian ceremonies.',
    category: 'Music & Art',
    tier: 'gobez'
  },

  // GENERAL KNOWLEDGE - GASHA (Easy)
  {
    id: 'gen-gasha-1',
    question: 'What is the currency of Eritrea?',
    options: ['Birr', 'Nakfa', 'Shilling', 'Pound'],
    correct: 'B',
    explanation: 'The Nakfa is the official currency of Eritrea, named after the town of Nakfa.',
    category: 'General Knowledge',
    tier: 'gasha'
  },
  {
    id: 'gen-gasha-2',
    question: 'What colors are on the Eritrean flag?',
    options: ['Red, Green, Blue', 'Red, Green, Yellow', 'Green, Blue, Yellow', 'Red, Blue, White'],
    correct: 'A',
    explanation: 'The Eritrean flag has red, green, and blue colors with a gold wreath and olive branch.',
    category: 'General Knowledge',
    tier: 'gasha'
  },

  // GENERAL KNOWLEDGE - QOLA (Medium)
  {
    id: 'gen-qola-1',
    question: 'What is the approximate population of Eritrea?',
    options: ['2 million', '3.5 million', '6 million', '10 million'],
    correct: 'C',
    explanation: 'Eritrea has an estimated population of around 6 million people.',
    category: 'General Knowledge',
    tier: 'qola'
  },
  {
    id: 'gen-qola-2',
    question: 'How many ethnic groups are recognized in Eritrea?',
    options: ['3', '6', '9', '12'],
    correct: 'C',
    explanation: 'Eritrea officially recognizes nine ethnic groups, each with distinct languages and cultures.',
    category: 'General Knowledge',
    tier: 'qola'
  },

  // GENERAL KNOWLEDGE - GOBEZ (Hard)
  {
    id: 'gen-gobez-1',
    question: 'What is the literacy rate in Eritrea approximately?',
    options: ['50%', '65%', '76%', '85%'],
    correct: 'C',
    explanation: 'Eritrea\'s literacy rate is approximately 76%, with ongoing education initiatives.',
    category: 'General Knowledge',
    tier: 'gobez'
  },

  // GENERAL KNOWLEDGE - SHIMAGILE (Expert)
  {
    id: 'gen-shim-1',
    question: 'What percentage of Eritrea\'s land is arable?',
    options: ['5%', '10%', '15%', '20%'],
    correct: 'A',
    explanation: 'Only about 5% of Eritrea\'s land is arable, making agriculture challenging.',
    category: 'General Knowledge',
    tier: 'shimagile'
  },

  // Additional SHIMAGILE (Expert) questions
  {
    id: 'hist-shim-1',
    question: 'What was the name of the Eritrean liberation front founded in 1961?',
    options: ['ELF', 'EPLF', 'EPRDF', 'TPLF'],
    correct: 'A',
    explanation: 'The Eritrean Liberation Front (ELF) was founded in 1961, starting the independence struggle.',
    category: 'History',
    tier: 'shimagile'
  },
  {
    id: 'geo-shim-1',
    question: 'What is the name of the desert region in southeastern Eritrea?',
    options: ['Sahara', 'Danakil', 'Nubian', 'Kalahari'],
    correct: 'B',
    explanation: 'The Danakil Depression extends into southeastern Eritrea, one of the hottest places on Earth.',
    category: 'Geography',
    tier: 'shimagile'
  },
  {
    id: 'cult-shim-1',
    question: 'What is the traditional Eritrean clarified butter called?',
    options: ['Ghee', 'Tesmi', 'Samna', 'Smen'],
    correct: 'B',
    explanation: 'Tesmi is the traditional spiced clarified butter used in Eritrean cooking.',
    category: 'Culture & Traditions',
    tier: 'shimagile'
  },
  {
    id: 'lang-shim-1',
    question: 'How many characters are in the Ge\'ez script?',
    options: ['182', '231', '276', '345'],
    correct: 'C',
    explanation: 'The Ge\'ez script has 276 characters, each representing a consonant-vowel combination.',
    category: 'Language',
    tier: 'shimagile'
  },
  {
    id: 'music-shim-1',
    question: 'What year did Yemane Barya pass away?',
    options: ['1997', '2001', '2005', '2007'],
    correct: 'B',
    explanation: 'Yemane Barya passed away in 2001, leaving a lasting legacy in Eritrean music.',
    category: 'Music & Art',
    tier: 'shimagile'
  }
];

export default questionsData;
