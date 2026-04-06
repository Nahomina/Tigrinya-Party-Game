// Mayim — Tigrinya Proverbs (ምስላ) Word Bank
// Each entry: { tigrinya (Ge'ez script), latin (romanisation), english (meaning), difficulty }
// difficulty is auto-tagged: 'easy' = 3–4 words, 'medium' = 5–6 words, 'hard' = 7+ words

const PROVERBS = [

  // ── Easy (3–4 words — show first 2, mask last 1) ──────────────────────────
  {
    tigrinya:   'ፍቕሪ ዕዉር ኢዩ',
    latin:      'Fiqri iwur iyu',
    english:    'Love is blind',
    difficulty: 'easy',
  },
  {
    tigrinya:   'ሓቂ ጸሓይ ኢያ',
    latin:      'Haqi tsehay iya',
    english:    'Truth is the sun',
    difficulty: 'easy',
  },
  {
    tigrinya:   'ሰላም ዓቢ ሃብቲ',
    latin:      'Selam abi habti',
    english:    'Peace is great wealth',
    difficulty: 'easy',
  },
  {
    tigrinya:   'ሓዳር ዓቢ ሕይወት',
    latin:      'Hadar abi hywet',
    english:    'Family is great life',
    difficulty: 'easy',
  },
  {
    tigrinya:   'ሰናይ ቃል ልቢ ይኽፍት',
    latin:      'Senay qal libi ykheft',
    english:    'A kind word opens the heart',
    difficulty: 'easy',
  },

  // ── Medium (5–6 words — show first 50%, mask rest) ────────────────────────
  {
    tigrinya:   'ዝሰርሐ ኢዱ ዘይሓስር',
    latin:      'Zserihe idu zeyhaser',
    english:    'He who works does not lose his hand',
    difficulty: 'medium',
  },
  {
    tigrinya:   'ብዙሕ ኢድ ዕዮ ቀሊሉ',
    latin:      'Bzuh id eyo qelilu',
    english:    'Many hands make work easy',
    difficulty: 'medium',
  },
  {
    tigrinya:   'ሕጊ ዘይፈልጥ ንጹህ ኣይኮነን',
    latin:      'Hgi zeyfeltsi ntsuH aykonenj',
    english:    'One who does not know the law is not innocent',
    difficulty: 'medium',
  },
  {
    tigrinya:   'ናብ ሃገሩ ዝኸደ ዘይጠፍእ',
    latin:      'Nab hageru zkede zeytfei',
    english:    'One who goes to their homeland does not get lost',
    difficulty: 'medium',
  },
  {
    tigrinya:   'ቀዳም ዝዘርኤ ሰንበት ይሕፍስ',
    latin:      'Qedam zzerie senbet yhifs',
    english:    'What is sown on Saturday is harvested on Sunday',
    difficulty: 'medium',
  },
  {
    tigrinya:   'ሓሶት ዓቢ ጸላኢ ሰብ',
    latin:      'Hasot abi tsielai seb',
    english:    'A lie is a person\'s greatest enemy',
    difficulty: 'medium',
  },
  {
    tigrinya:   'ሰብ ዘይፈልጦ ሰብ ኣይፈልጦን',
    latin:      'Seb zeyfelho seb ayfelhonn',
    english:    'One who does not know others is not known by others',
    difficulty: 'medium',
  },
  {
    tigrinya:   'ምቕዋም ዘሎ ሰብ ኣይወድቕን',
    latin:      'Miqwam zelo seb aywediqn',
    english:    'A person who has balance does not fall',
    difficulty: 'medium',
  },
  {
    tigrinya:   'ዝኸፈተ ኣፍ ዝሓዘ ሎሚ',
    latin:      'Zkefete af zhaze lomi',
    english:    'The mouth that opened holds something today',
    difficulty: 'medium',
  },

  // ── Hard (7+ words — show first 50%, mask rest) ────────────────────────────
  {
    tigrinya:   'ሓቂ ጸሓይ ከም ዘይትኽወል ይፍለጥ',
    latin:      'Haqi tsehay kem zeytkhewel yfeltet',
    english:    'Truth is known like the sun that cannot be hidden',
    difficulty: 'hard',
  },
  {
    tigrinya:   'ዝበልዐ ዘይስዓር ዝደቀሰ ዘይሰኣን',
    latin:      'Zbelia zeysiar zdiqese zeysian',
    english:    'What is eaten is not wasted, what is slept is not missed',
    difficulty: 'hard',
  },
  {
    tigrinya:   'ሕሱም ሰብ ናብ ጽቡቕ ቦታ ኣይኸድን',
    latin:      'Hsum seb nab tsbuk bota aykedn',
    english:    'A wicked person does not go to a good place',
    difficulty: 'hard',
  },
  {
    tigrinya:   'ኣብ ዝዓበኻ ዓዲ ሕማቕ ሰብ ኣይትኸን',
    latin:      'Ab zdabeka adi hmaq seb aytken',
    english:    'Do not be a bad person in the village where you grew up',
    difficulty: 'hard',
  },
  {
    tigrinya:   'ብጾት ዘይብሉ ሰብ ዛፍ ዘይብሉ ሜዳ',
    latin:      'Btsot zeyblu seb zaf zeyblu meda',
    english:    'A person without friends is a field without trees',
    difficulty: 'hard',
  },
  {
    tigrinya:   'ዝኸደ ዝሓደሮ ዝቐነዮ ዝሓዘሎ',
    latin:      'Zkede zhadero zqeneyo zhazelo',
    english:    'Where one goes they stay, where one rests they remain',
    difficulty: 'hard',
  },
  {
    tigrinya:   'ሰብ ናብ ሰቡ ዝተመልሰ ጠፊኡ ኣይኮነን',
    latin:      'Seb nab sebu ztemelse tefiu aykonenj',
    english:    'A person who returns to their people is not lost',
    difficulty: 'hard',
  },
  {
    tigrinya:   'ብዘይ ምምሃር ዕቤት ዘሎ ምስምስ ኣይኮነን',
    latin:      'Bzeyi mmehar ibiet zelo msmss aykonenj',
    english:    'Growth without learning is merely an excuse',
    difficulty: 'hard',
  },
  {
    tigrinya:   'ጸጋ ዝኸፍሎ ምቕዳም ዝሓትቶ ትሕትና',
    latin:      'Tsega zkeflo miqdam zhato tihtna',
    english:    'Fortune demands diligence, then asks for humility',
    difficulty: 'hard',
  },
  {
    tigrinya:   'ኣብ ቤት ዝፈሰሰ ናብ ሃገር ዘይፈስስ',
    latin:      'Ab bet zfesse nab hager zeyfess',
    english:    'What is poured in the house does not flow to the nation',
    difficulty: 'hard',
  },
  {
    tigrinya:   'እዛ ሕጂ ዝኽፈታ ዓወት ጽባሕ ዝዝከር',
    latin:      'Iza hji zkefeta awet tsbah zzkr',
    english:    'The victory opened today is remembered tomorrow',
    difficulty: 'hard',
  },

];
