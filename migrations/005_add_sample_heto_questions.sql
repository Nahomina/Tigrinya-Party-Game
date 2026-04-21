-- Migration: 005_add_sample_heto_questions
-- Adds 20 sample trivia questions across all categories and difficulties

INSERT INTO heto_questions (question, question_latin, options, correct_option, explanation, category, difficulty) VALUES
  ('ኢትዮጵያ ዋና ከተማ ምንድነው?', 'Ityopya wana ketema mindnew?',
   '[{"label":"A","text":"አዲስ አበባ","latin":"Addis Ababa"},{"label":"B","text":"ሲሳ","latin":"Sisa"},{"label":"C","text":"ማዕከላይ","latin":"Maaklay"},{"label":"D","text":"ጋላ","latin":"Gala"}]',
   'A', 'አዲስ አበባ ኢትዮጵያ ዋና ከተማ ናይ 1886 ምስ ሚኔሊክ።', 'Geography', 'easy'),

  ('ሕቶ ንምንታይ ይባሃል?', 'Heto nemnta''ey yibahal?',
   '[{"label":"A","text":"ምሕዋት","latin":"Mihewat"},{"label":"B","text":"ገዳይም ምግባር","latin":"Gedaym migbar"},{"label":"C","text":"ሕቶ ነገር ምዃን","latin":"Heto neger muan"},{"label":"D","text":"ሥነ ድርሲ","latin":"Sine dirsi"}]',
   'C', 'ሕቶ ዝሊዕ ዘሎ ገዳሲ ነገር እዩ።', 'Language', 'easy'),

  ('ኤሪትራ ብዝኸይናዋ እተተሸወ ዕለት?', 'Eritrea bzikeynawa itteteshwe alit?',
   '[{"label":"A","text":"24 ግንቦት 1993","latin":"24 Ginbot 1993"},{"label":"B","text":"28 ግንቦት 1991","latin":"28 Ginbot 1991"},{"label":"C","text":"1 ጃንዋሪ 1952","latin":"1 January 1952"},{"label":"D","text":"17 ኖቬምበር 1999","latin":"17 November 1999"}]',
   'A', 'ኤሪትራ ብ 24 ግንቦት 1993 ከብዳድ ተወሰደት።', 'History', 'medium'),

  ('ዝበሎ ካብ መሳሪሕ ትግርኛ ነበረ?', 'Zibelo kab mesarib tigrnya nebere?',
   '[{"label":"A","text":"ገዳፍ","latin":"Gedef"},{"label":"B","text":"ዝለዋ","latin":"Zilewa"},{"label":"C","text":"ውዝቂ","latin":"Wizki"},{"label":"D","text":"ስርር","latin":"Sirir"}]',
   'A', 'ገዳፍ ካብ መሳሪሕ ትግርኛ ነቢዩ።', 'Culture', 'hard'),

  ('ኣስመራ ኢትዮጵያ ወይ ኤሪትራ?', 'Asmera Ityopya we Eritrea?',
   '[{"label":"A","text":"ኢትዮጵያ","latin":"Ityopya"},{"label":"B","text":"ኤሪትራ","latin":"Eritrea"},{"label":"C","text":"ከ ክልቦም","latin":"Ke kilbom"},{"label":"D","text":"ምስር","latin":"Misr"}]',
   'B', 'ኣስመራ ዋና ከተማ ኤሪትራ ምዃና።', 'Geography', 'easy'),

  ('ቅርነት ትግርኛ ጻሕፍቲ ስንት ዓሌት ዩ?', 'Kirnit tigrnya tsahfti sinit alit yu?',
   '[{"label":"A","text":"26","latin":"26"},{"label":"B","text":"33","latin":"33"},{"label":"C","text":"28","latin":"28"},{"label":"D","text":"30","latin":"30"}]',
   'B', 'ጊዜዚ ትግርኛ ጸሕፍቲ 33 ዓሌት ናይ ከይሰ።', 'Language', 'hard'),

  ('ሃገር ትግራይ ኣበይ ድሌት?', 'Hager tigray abey delet?',
   '[{"label":"A","text":"ሰሜን","latin":"Samen"},{"label":"B","text":"ደቡብ","latin":"Debub"},{"label":"C","text":"ምብራቕ","latin":"Mibrak"},{"label":"D","text":"ምዕራብ","latin":"Mirab"}]',
   'A', 'ትግራይ ሰሜን ሃገር ኢትዮጵያ።', 'Geography', 'easy'),

  ('ማይም ቅጹር ምንድነው?', 'Mayim kutzur mindnew?',
   '[{"label":"A","text":"ምግባር ቅጹር","latin":"Migbar kutzur"},{"label":"B","text":"ቃል ምብጋር","latin":"Kal migbar"},{"label":"C","text":"ምልክት ንግግር","latin":"Milkit nigir"},{"label":"D","text":"ሥሪት ጥንቄ","latin":"Sirit tinke"}]',
   'B', 'ማይም ካብ ክፍልታት ወጥሪ ናይ ትግርኛ ጥበብ።', 'Language', 'easy'),

  ('ኢንጃራ ካብ ምንት ሰብተዓ?', 'Injara kab mint sebtea?',
   '[{"label":"A","text":"ሐንደ","latin":"Hande"},{"label":"B","text":"ጤፍ","latin":"Tef"},{"label":"C","text":"ገሊ","latin":"Geli"},{"label":"D","text":"ቢጫ","latin":"Bicha"}]',
   'B', 'ኢንጃራ ካብ ጤፍ ሰብተዓ ነቢዩ።', 'Culture', 'easy'),

  ('ምስላ ሥራይ ምንድነው?', 'Misla sray mindnew?',
   '[{"label":"A","text":"ምግባር ወይ ምእታ","latin":"Migbar we miata"},{"label":"B","text":"ግሙሕ ዐቢይ ምርኢት","latin":"Gimuh abiy mirit"},{"label":"C","text":"ሥዋ ትግርኛ","latin":"Swa tigrnya"},{"label":"D","text":"ጌታ ምቅየር","latin":"Geta mikyer"}]',
   'A', 'ምስላ ንብለዮ ሥራይ ምግባር ወይም ምእታ ነቢዩ።', 'Language', 'medium'),

  ('ሕቶ ጨዋታ ምንታይ ይባሃል?', 'Heto chawata mnta''ey yibahal?',
   '[{"label":"A","text":"ሥራይ ንግግር","latin":"Sray nigir"},{"label":"B","text":"ጨዋታ ዕዲ","latin":"Chawata idi"},{"label":"C","text":"ምሕዋት ምቅየር","latin":"Mihewat mikyer"},{"label":"D","text":"ስነ ድርሲ ነገር","latin":"Sine dirsi neger"}]',
   'B', 'ሕቶ ጨዋታ ብዕዲ ተጻወተ።', 'Culture', 'easy'),

  ('ነሐሰ ወርሒ ምንድነው?', 'Nehase werhi mindnew?',
   '[{"label":"A","text":"ሙሉእ ዓመት","latin":"Mulu amet"},{"label":"B","text":"ማዓሠ ወርሒ","latin":"Ma''ase werhi"},{"label":"C","text":"ቅበላ ወርሒ","latin":"Kibela werhi"},{"label":"D","text":"ጀምሪ ዓመት","latin":"Jemri amet"}]',
   'C', 'ነሐሰ ቅበላ ወርሒ ንባ ትግርኛ።', 'Culture', 'medium'),

  ('ቴሎሪ ምንታይ ዩ?', 'Telori mnta''ey yu?',
   '[{"label":"A","text":"ካብ ምስር","latin":"Kab Misr"},{"label":"B","text":"ካብ ኤሪትራ","latin":"Kab Eritrea"},{"label":"C","text":"ካብ ግብፅ","latin":"Kab Gibs"},{"label":"D","text":"ካብ ስዋን","latin":"Kab Siwan"}]',
   'A', 'ቴሎሪ ምስሪ ነገር ዩ።', 'History', 'medium'),

  ('በዓሎ ማስከረምታ ናይ ትግርኛ ምንድነው?', 'Bealo maskeremnta na''ey tigrnya mindnew?',
   '[{"label":"A","text":"ዕለት ሰንበት","latin":"Alit sanbet"},{"label":"B","text":"ሚሒረትቲ","latin":"Miherti"},{"label":"C","text":"ፊደላት","latin":"Fidelat"},{"label":"D","text":"ዘማሪ ምግባር","latin":"Zamari migbar"}]',
   'B', 'ሚሒረትቲ ዝተመዝገበ በዓል ናይ ትግርኛ።', 'Culture', 'hard'),

  ('ምስ ሙሌ ምንታይ ተገበረ?', 'Mis Mule mnta''ey tegebere?',
   '[{"label":"A","text":"ጽሑፍ ሐብሺ","latin":"Tsehuf habshi"},{"label":"B","text":"ስውር ንግግር","latin":"Swir nigir"},{"label":"C","text":"ንግግር ሐወስ","latin":"Nigir hawes"},{"label":"D","text":"ሰባይ መሰሪት","latin":"Sebay mesrit"}]',
   'A', 'ምስ ሙሌ ጽሑፍ ሐብሺ ተገበረ።', 'History', 'hard'),

  ('ጠቤ ምንታይ ዯሌት?', 'Tabe mnta''ey delet?',
   '[{"label":"A","text":"ዕለተ ዓመት","latin":"Alite amet"},{"label":"B","text":"ሪእዮ ሰብ","latin":"Rio seb"},{"label":"C","text":"ጨዋታ ማዕከላይ","latin":"Chawata maaklay"},{"label":"D","text":"ምግባር ሰይ","latin":"Migbar say"}]',
   'C', 'ጠቤ ጨዋታ ማዕከላይ ኣበይ ድሌት።', 'Culture', 'medium'),

  ('ሩስቲ ምንታይ ዮ?', 'Rusti mnta''ey yo?',
   '[{"label":"A","text":"ምግባር ነገር","latin":"Migbar neger"},{"label":"B","text":"ሒወታት መስሪት","latin":"Hiewtat mesrit"},{"label":"C","text":"ሰበ ምርናዕ","latin":"Sebe mirnaa''u"},{"label":"D","text":"ስራይ ሰይ","latin":"Sray say"}]',
   'B', 'ሩስቲ ሒወታት መስሪት ብዓዘዝ።', 'Culture', 'hard'),

  ('በሌ ድያስ ካበይ ወረደ?', 'Bile Diyas kaabey wereda?',
   '[{"label":"A","text":"ፖርቱጋል","latin":"Portugal"},{"label":"B","text":"እስጳንያ","latin":"Ispanya"},{"label":"C","text":"ጣሊያን","latin":"Talyan"},{"label":"D","text":"ኢንግሊዝ","latin":"Ingliz"}]',
   'A', 'በሌ ድያስ ካ ፖርቱጋል ወረደ።', 'History', 'medium'),

  ('ትግርኛ ሥወ ዝሲ ንበልኦ?', 'Tigrnya swe zisi nibelo?',
   '[{"label":"A","text":"ስወ ሰበ","latin":"Swe sebe"},{"label":"B","text":"ስወ ሕቡእ","latin":"Swe hibuu''"},{"label":"C","text":"ስወ ልብ","latin":"Swe lib"},{"label":"D","text":"ስወ ግዝ","latin":"Swe giz"}]',
   'A', 'ትግርኛ ሥወ ሰበ ኢዛ ስመ።', 'Language', 'easy'),

  ('ተመሰገነ ሩሙ ዎሪስነት ታሪኽ?', 'Teemsegende Rumu wrosnit tarikh?',
   '[{"label":"A","text":"1837","latin":"1837"},{"label":"B","text":"1844","latin":"1844"},{"label":"C","text":"1850","latin":"1850"},{"label":"D","text":"1856","latin":"1856"}]',
   'B', 'ተመሰገነ ሩሙ 1844 ዎሪስነት ተወለደ።', 'History', 'hard');
