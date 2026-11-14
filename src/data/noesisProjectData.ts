export type ProjectId = 'project1' | 'project2';

export type SceneCategory = 'problem' | 'hardware' | 'biometric' | 'montage';

export type CharacterAnchor = 'clinic_doctor' | 'clinic_patient' | 'tech_standalone';

export type FigmaPlateCode = 'FIG-01' | 'FIG-02' | 'FIG-03' | 'FIG-04' | 'FIG-05';

export interface MasterStyleGuide {
  clinicPrompt: string;
  doctorPrompt: string;
  patientPrompt: string;
  clinicSummaryAr: string;
  doctorSummaryAr: string;
  patientSummaryAr: string;
}

export interface PromoScene {
  id: number;
  projectId: ProjectId;
  code: string;
  titleAr: string;
  titleEn: string;
  timeRange: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  recommendedVideoDuration: '8s' | '10s';
  category: SceneCategory;
  categoryLabelAr: string;
  characterAnchor: CharacterAnchor;
  conceptAr: string;
  imagePrompt: string;
  motionPrompt: string;
  frameDeRaccordAr: string;
  figmaOverlayCode?: FigmaPlateCode;
  threeTechSceneId?: 3 | 4 | 5;
  isSilentMusicalBeat?: boolean;
  lipSyncTargetAr?: string;
  visualSource: 'generated_keyframe';
  serverImagePath: string;
  voiceoverSegmentAr: string;
  keyMetricBadge?: string;
}

export interface FigmaReferenceScreen {
  id: number;
  code: FigmaPlateCode;
  titleAr: string;
  conceptAr: string;
  imagePath: string;
  filename: string;
}

export interface SubtitleCue {
  id: number;
  timeRange: string;
  startSec: number;
  endSec: number;
  textEn: string;
  textArHint: string;
}

export interface ProjectDefinition {
  id: ProjectId;
  nameAr: string;
  shortNameAr: string;
  subtitleAr: string;
  totalDurationSec: number;
  scenes: PromoScene[];
  voiceoverScriptAr: string;
  subtitlesEn: SubtitleCue[];
}

export interface ModelBenchmark {
  task: 'FER' | 'FV';
  modelName: string;
  dataset: string;
  accuracy: string;
  secondaryMetricLabel: string;
  secondaryMetricValue: string;
  inferenceTimeMs: string;
  selected: boolean;
  notesAr: string;
}

export interface MedicalStandard {
  code: string;
  titleAr: string;
  titleEn: string;
  scopeAr: string;
}

export const CHARACTER_REFERENCE_ASSETS: Record<'clinic_doctor' | 'clinic_patient', string[]> = {
  clinic_doctor: [
    'src/assets/images/real_p1_sc01_doctor_papers_1794690230009.jpg',
    'src/assets/images/real_p1_sc07_doctor_faceid_1794690251432.jpg',
  ],
  clinic_patient: [
    'src/assets/images/real_anchor_noura_portrait_1794690231793.jpg',
    'src/assets/images/real_p1_sc10_noura_emotion_1794690302225.jpg',
  ],
};

export const MASTER_STYLE_GUIDE: MasterStyleGuide = {
  clinicPrompt:
    'Photorealistic live-action 35mm cinema film, ARRI Alexa Mini LF optical look, 16:9, 1080p, 30fps, authentic modern Saudi mental health clinic with warm white plaster walls, natural light-oak wood desk, lush sage-green indoor plants, natural window daylight and realistic shallow depth of field, authentic human skin texture and fabric folds, smooth stabilized gimbal camera with zero jitter, strictly zero cartoon style, strictly no on-screen text, no numbers, no UI screens',
  doctorPrompt:
    'exact same real 40-year-old Arab male clinical psychologist (Dr. Salem) from the character reference photographs, locked photorealistic facial identity, short black hair with subtle gray temples, neat trimmed salt-and-pepper beard, thin black rectangular eyeglasses, crisp light-blue button-down shirt under a tailored white cotton medical coat',
  patientPrompt:
    'exact same real 25-year-old Arab woman (Noura) from the character reference photographs, locked photorealistic facial identity, warm expressive dark brown eyes, natural subtle skin texture, wearing the exact soft taupe-beige chiffon hijab and tailored sage-green blazer',
  clinicSummaryAr:
    'تصوير سينمائي واقعي حي بالكامل (ARRI Alexa Mini LF 35mm) بدقة 1080p و30fps: عيادة نفسية حقيقية بإضاءة نهارية طبيعية، خشب بلوط دافئ، نباتات خضراء طبيعية، وتدرج بصري متماسك بين المشروعين بدون أي رسوم كرتونية أو نصوص مشوهة.',
  doctorSummaryAr:
    'الأخصائي د. سالم (40 عاماً) بهوية بصرية واقعية مثبتة في جميع مشاهد المشروعين: شعر أسود بشيب خفيف، لحية مهذبة، نظارة مستطيلة سوداء رفيعة، قميص أزرق سماوي ومعطف طبي أبيض قطني — بصور طبيعية 100% خالية من أي شبكة مرسومة على الوجه.',
  patientSummaryAr:
    'المريضة نورة (25 عاماً) بهوية بصرية واقعية مثبتة في المشروعين: ملامح طبيعية صادقة، حجاب بيج ناعم، وسترة باللون الأخضر المريمي — أمام شاشة لوحية بلون باستيل نعناعي صافية تماماً جاهزة لتركيب Figma.',
};

export const PROJECT_1_SCENES: PromoScene[] = [
  {
    id: 1,
    projectId: 'project1',
    code: 'P1-01',
    titleAr: 'الأوراق المتراكمة وإرهاق الأخصائي',
    titleEn: 'Stacked Paperwork & Clinician Fatigue',
    timeRange: '0:00 - 0:10',
    startSec: 0,
    endSec: 10,
    durationSec: 10,
    recommendedVideoDuration: '10s',
    category: 'problem',
    categoryLabelAr: 'تحديات العيادة',
    characterAnchor: 'clinic_doctor',
    conceptAr:
      'لقطة سينمائية واقعية: د. سالم يجلس خلف أكوام الاستبيانات الورقية البيضاء، يتنهد بعمق ويرفع يده ليمسح جبهته بإرهاق حقيقي ثم ينظر نحو الأوراق.',
    imagePrompt:
      'seated at his light oak clinic desk surrounded by tall cluttered stacks of plain blank white paper questionnaires, medium cinematic shot',
    motionPrompt:
      'Photorealistic live-action human performance at 1x speed: Dr. Salem takes a deep breath and exhales a visible tired sigh with realistic chest and shoulder movement, slowly lifts his hand to rub his forehead beneath his fingertips, blinks twice naturally, lowers his hand back to the desk, and sweeps his weary gaze down across the tall stacks of blank forms. Smooth slow gimbal push-in, zero jitter, strictly no text.',
    frameDeRaccordAr: 'القطع عند امتداد يد د. سالم نحو القلم الأحمر على الورقة — يربط مباشرة بلقطة P1-02.',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/real_p1_sc01_doctor_papers_1794690230009.jpg',
    voiceoverSegmentAr:
      'تعتمد العيادات النفسية حتى يومنا هذا على الاستبيانات الورقية التقليدية؛ مما يسبب ضغطاً كبيراً على الأخصائي،',
    keyMetricBadge: '10s · واقعي · + صوت عربي',
  },
  {
    id: 2,
    projectId: 'project1',
    code: 'P1-02',
    titleAr: 'التصحيح اليدوي والالتفات للساعة',
    titleEn: 'Manual Red Pen Scoring & Clock Glance',
    timeRange: '0:10 - 0:20',
    startSec: 10,
    endSec: 20,
    durationSec: 10,
    recommendedVideoDuration: '10s',
    category: 'problem',
    categoryLabelAr: 'تحديات العيادة',
    characterAnchor: 'clinic_doctor',
    conceptAr:
      'من فوق كتف د. سالم: يرسم علامة X بقلم أحمر حقيقي فوق استبيان فارغ، يهزّ رأسه بأسف صامت ثم يلتفت نحو ساعة الحائط.',
    imagePrompt:
      'over-the-shoulder photorealistic close-up holding a classic red ballpoint pen over plain blank paper forms with a blurred minimalist wall clock behind',
    motionPrompt:
      'Photorealistic live-action performance at 1x real-time speed: Dr. Salem shifts his wrist naturally to mark a decisive red X on the unprinted paper sheet, pauses slightly, shakes his head gently side-to-side in quiet weariness while blinking realistically, then turns his head and gaze up toward the blurred wall clock. Smooth stabilized camera, zero jitter, strictly no readable text or numbers.',
    frameDeRaccordAr: 'عند ارتفاع نظر د. سالم وانكسار الضوء نحو البرودة — ينتقل إلى مشهد السحابة P1-03.',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/real_p1_sc02_red_pen_clock_1794690247738.jpg',
    voiceoverSegmentAr: 'وبطء التقييم، وأخطاء التصحيح اليدوي المتكررة،',
    keyMetricBadge: '10s · واقعي · + صوت عربي',
  },
  {
    id: 3,
    projectId: 'project1',
    code: 'P1-03',
    titleAr: 'مخاطر التسريب السحابي',
    titleEn: 'Cloud Privacy Breach Risk',
    timeRange: '0:20 - 0:30',
    startSec: 20,
    endSec: 30,
    durationSec: 10,
    recommendedVideoDuration: '10s',
    category: 'problem',
    categoryLabelAr: 'مخاطر الخصوصية',
    characterAnchor: 'tech_standalone',
    threeTechSceneId: 3,
    conceptAr:
      'لقطة مؤثرات بصرية سينمائية داكنة (بدون بشر): أوراق ملفات شفافة تتطاير من المكتب نحو سحابة عاصفة حول درع زجاجي أحمر متصدع.',
    imagePrompt:
      'photorealistic dark-studio conceptual VFX photograph, translucent blank paper sheets floating upward toward a moody volumetric storm cloud around a fractured crimson smoked-glass shield and brushed padlock, optical studio lighting, zero humans, zero text',
    motionPrompt:
      'Photorealistic live-action optical VFX motion at steady pace: delicate illuminated blank sheets drift upward through dark studio atmosphere into the swirling storm cloud above, soft lightning glints inside the mist, and crimson glass fractures catch reflections cleanly around the padlock. Smooth gliding dolly camera, zero jitter, strictly no humans or text.',
    frameDeRaccordAr: 'تلاشي الضباب الداكن ليفتح بنقلة ضوء صباحي نقي على وحدة Raspberry Pi 5 في P1-04.',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/real_p1_sc03_cloud_breach_1794690250036.jpg',
    voiceoverSegmentAr: 'فضلاً عن مخاطر تسريب بيانات المرضى الحساسة عند تخزينها عبر الإنترنت.',
    keyMetricBadge: '10s · VFX / 3D + صوت عربي',
  },
  {
    id: 4,
    projectId: 'project1',
    code: 'P1-04',
    titleAr: 'وحدة Raspberry Pi 5 الطرفية',
    titleEn: 'Raspberry Pi 5 Edge Hardware',
    timeRange: '0:30 - 0:40',
    startSec: 30,
    endSec: 40,
    durationSec: 10,
    recommendedVideoDuration: '10s',
    category: 'hardware',
    categoryLabelAr: 'الحل الهندسي',
    characterAnchor: 'tech_standalone',
    threeTechSceneId: 4,
    conceptAr:
      'تصوير منتجات سينمائي واقعي لوحدة Raspberry Pi 5 البيضاء والزمردية مع الكاميرا المدمجة والتابلت النعناعي الصافي على طاولة البلوط في العيادة.',
    imagePrompt:
      'photorealistic 35mm macro studio product shot on natural oak clinic desk, sleek matte-white and sage-green Raspberry Pi 5 edge enclosure with glowing emerald LED dot, mounted silver-arm optical camera pod, and pure blank pastel-mint touchscreen tablet, zero text, zero UI',
    motionPrompt:
      'Photorealistic cinema camera orbit at slow graceful pace: the smooth gimbal arcs softly clockwise around the real physical Raspberry Pi 5 enclosure and blank pastel-mint tablet on the sunlit oak desk while the tiny emerald LED dot pulses gently and morning light shifts softly across the brushed metal ports. Zero jitter, strictly no text.',
    frameDeRaccordAr: 'ثبات زاوية الجهاز على طاولة العيادة لتنسدل حوله قبة الزجاج الأخضر الآمنة في P1-05.',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/real_p1_sc04_hardware_desk_1794690231930.jpg',
    voiceoverSegmentAr:
      'من هنا جاء الابتكار: NoesisAI؛ النظام الذكي المدمج بالكامل على جهاز Raspberry Pi 5،',
    keyMetricBadge: '10s · واقعي / 3D + صوت عربي',
  },
  {
    id: 5,
    projectId: 'project1',
    code: 'P1-05',
    titleAr: 'القبة الآمنة والعمل الأوفلاين 100%',
    titleEn: 'Offline Emerald Glass Sanctuary',
    timeRange: '0:40 - 0:50',
    startSec: 40,
    endSec: 50,
    durationSec: 10,
    recommendedVideoDuration: '10s',
    category: 'hardware',
    categoryLabelAr: 'الأمان والخصوصية',
    characterAnchor: 'tech_standalone',
    threeTechSceneId: 5,
    conceptAr:
      'لقطة واقعية مدمجة بمؤثر زجاجي بصري: قبة زجاجية زمردية متوهجة تُغلق بإحكام مع قفل فولاذي حقيقي فوق وحدة Raspberry Pi 5 داخل العيادة.',
    imagePrompt:
      'photorealistic live-action VFX shot in bright clinic, luminous translucent emerald protective optical glass dome enclosing the matte-white Raspberry Pi 5 device and blank pastel-mint tablet with brushed stainless-steel padlock locked cleanly at apex, zero humans, zero text',
    motionPrompt:
      'Photorealistic optical VFX motion at calm pace: subtle emerald light refractions ripple warmly across the smooth glass dome surface while the brushed steel padlock shackle settles and clicks softly into locked position. Smooth stabilized dolly-in, zero jitter, zero text.',
    frameDeRaccordAr: 'انعكاس الضوء الزمردي ينقلك فوراً إلى مكتب د. سالم أمام الشاشة البيضاء الصافية P1-06.',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/real_p1_sc05_offline_dome_1794690251369.jpg',
    voiceoverSegmentAr: 'والذي يعمل محلياً داخل العيادة دون أي اتصال بالإنترنت لضمان الخصوصية المطلقة.',
    keyMetricBadge: '10s · VFX / 3D + صوت عربي',
  },
  {
    id: 6,
    projectId: 'project1',
    code: 'P1-06',
    titleAr: 'شاشة الدخول (تركيب FIG-01)',
    titleEn: 'Clinician Login & Figma FIG-01 Plate',
    timeRange: '0:50 - 1:00',
    startSec: 50,
    endSec: 60,
    durationSec: 10,
    recommendedVideoDuration: '10s',
    category: 'montage',
    categoryLabelAr: 'العيادة + Figma',
    characterAnchor: 'clinic_doctor',
    figmaOverlayCode: 'FIG-01',
    conceptAr:
      'لقطة حقيقية من خلف كتف د. سالم وهو يضغط بالماوس اللاسلكي أمام شاشة ألمنيوم بيضاء صافية 100% جاهزة لتركيب FIG-01 في CapCut.',
    imagePrompt:
      'over-the-shoulder photorealistic shot of Dr. Salem seated at his clean oak clinic desk with right hand on wireless mouse facing a pure solid blank white widescreen monitor, strictly zero text or UI on monitor',
    motionPrompt:
      'Photorealistic live-action human motion at 1x speed: Dr. Salem leans subtly forward with natural breathing, guides his right hand smoothly across the white mouse to click once, and holds calm attentive posture before the pure blank white display. Slow steady push-in, zero jitter, white screen kept completely clean and stable for compositing.',
    frameDeRaccordAr: 'عند نقر الماوس، قطع أمامي مباشر إلى عيني د. سالم أمام الكاميرا في P1-07.',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/real_p1_sc06_doctor_login_1794690250442.jpg',
    voiceoverSegmentAr: 'بلمسة واحدة، يفتح الأخصائي بوابة النظام،',
    keyMetricBadge: '10s · تركيب FIG-01',
  },
  {
    id: 7,
    projectId: 'project1',
    code: 'P1-07',
    titleAr: 'التحقق البيومتري للوجه Face ID',
    titleEn: 'Clinician Biometric Face Verification',
    timeRange: '1:00 - 1:10',
    startSec: 60,
    endSec: 70,
    durationSec: 10,
    recommendedVideoDuration: '10s',
    category: 'biometric',
    categoryLabelAr: 'التحقق البيومتري',
    characterAnchor: 'clinic_doctor',
    conceptAr:
      'لقطة قريبة واقعية لوجه د. سالم ببشرة طبيعية نقية تماماً (بدون أي شبكة مرسومة): ينظر إلى الكاميرا، يرمش، يعبر انعكاس ضوئي أخضر ناعم على نظارته ويبتسم.',
    imagePrompt:
      'photorealistic 85mm close-up portrait of Dr. Salem looking gently toward the clinic webcam in warm natural light, authentic human skin pores with zero painted grids or lines on face, subtle natural green optical glint on eyeglasses',
    motionPrompt:
      'Photorealistic live-action facial performance at 1x speed: Dr. Salem gazes calmly toward the lens, blinks naturally twice, breathes steadily as a delicate soft emerald light glint sweeps gently across his eyeglass lenses, then relaxes into a warm confident smile and subtle approving nod. Zero jitter, strictly no persistent grid on skin, no text.',
    frameDeRaccordAr: 'استمرار ابتسامة د. سالم والتفاته نحو لوحة اختيار المقياس في P1-08.',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/real_p1_sc07_doctor_faceid_1794690251432.jpg',
    voiceoverSegmentAr: 'ويسجّل دخوله بأمان تام عبر التحقق البيومتري للوجه بدقة 89.09%.',
    keyMetricBadge: '10s · VGG-Face 89.09%',
  },
  {
    id: 8,
    projectId: 'project1',
    code: 'P1-08',
    titleAr: 'اختيار المريض والمقياس (تركيب FIG-02)',
    titleEn: 'Patient & Scale Selection (FIG-02)',
    timeRange: '1:10 - 1:20',
    startSec: 70,
    endSec: 80,
    durationSec: 10,
    recommendedVideoDuration: '10s',
    category: 'montage',
    categoryLabelAr: 'العيادة + Figma',
    characterAnchor: 'clinic_doctor',
    figmaOverlayCode: 'FIG-02',
    conceptAr:
      'لقطة جانبية واقعية لد. سالم بجانب الشاشة البيضاء الصافية وهو يختار المقياس النفسي ثم يلتفت بابتسامة ترحيبية نحو كرسي المريضة (تركيب FIG-02).',
    imagePrompt:
      'photorealistic medium side-angle shot of Dr. Salem seated at his clean clinic desk next to a glowing pure solid blank white monitor, turning warmly toward the cozy patient armchair in soft daylight, zero text on monitor',
    motionPrompt:
      'Photorealistic live-action performance at 1x speed: Dr. Salem clicks softly once with his hand on the mouse, pauses thoughtfully before the clean blank white screen, then turns his head and shoulders warmly toward the patient armchair with an inviting nod and reassuring smile. Smooth subtle lateral dolly, zero jitter, screen remains blank white.',
    frameDeRaccordAr: 'التفاتة الترحيب من د. سالم تقطع بسلاسة إلى يد نورة وهي تلمس شاشة المريض في P1-09.',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/real_p1_sc08_doctor_scale_select_1794690252916.jpg',
    voiceoverSegmentAr: 'ليختار ملف المريض والمقياس النفسي المعتمد مثل Y-BOCS أو BDI أو TMAS.',
    keyMetricBadge: '10s · تركيب FIG-02',
  },
  {
    id: 9,
    projectId: 'project1',
    code: 'P1-09',
    titleAr: 'المريضة نورة تجيب على شاشة اللمس',
    titleEn: 'Noura Responds on Touchscreen',
    timeRange: '1:20 - 1:30',
    startSec: 80,
    endSec: 90,
    durationSec: 10,
    recommendedVideoDuration: '10s',
    category: 'biometric',
    categoryLabelAr: 'بوابة المريض',
    characterAnchor: 'clinic_patient',
    conceptAr:
      'لقطة واقعية لنورة بحجابها البيج وسترتها المريمية جالسة بارتياح بجوار وحدة Raspberry Pi 5: ترفع يدها وتلمس الشاشة النعناعية الصافية بإيماءة هادئة.',
    imagePrompt:
      'photorealistic medium three-quarter shot of Noura seated comfortably in clinic armchair touching a pure blank pastel-mint touchscreen tablet beside the white-and-sage Raspberry Pi 5 device and optical camera pod, strictly zero text or UI',
    motionPrompt:
      'Photorealistic live-action human motion at 1x speed: Noura keeps her warm eyes focused gently on the blank pastel-mint screen, blinks naturally, lifts her right hand smoothly to tap the glass surface twice with realistic fingertip contact, then relaxes her hand with natural chest breathing and a subtle calm nod. Steady tripod cinema shot, zero jitter, zero screen text.',
    frameDeRaccordAr: 'أثناء تفاعل نورة المريح، نقترب في لقطة بورتريه أمامية لملامحها الصادقة P1-10.',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/real_p1_sc09_noura_touch_1794690301351.jpg',
    voiceoverSegmentAr: 'أثناء إجابة المريض بارتياح عبر شاشة اللمس المخصصة،',
    keyMetricBadge: '10s · واقعي · + صوت عربي',
  },
  {
    id: 10,
    projectId: 'project1',
    code: 'P1-10',
    titleAr: 'تحليل المشاعر الفوري ViT (تركيب FIG-03)',
    titleEn: 'Real-Time ViT Emotion Analysis (FIG-03)',
    timeRange: '1:30 - 1:40',
    startSec: 90,
    endSec: 100,
    durationSec: 10,
    recommendedVideoDuration: '10s',
    category: 'biometric',
    categoryLabelAr: 'التحليل البيومتري',
    characterAnchor: 'clinic_patient',
    figmaOverlayCode: 'FIG-03',
    conceptAr:
      'بورتريه سينمائي نقي لوجه نورة وهي تنظر نحو عدسة الكاميرا المثبتة: ملامح طبيعية تتحول بسلاسة من الترقب إلى السكينة والارتياح (لتركيب FIG-03 بجانبها).',
    imagePrompt:
      'photorealistic 85mm close-up portrait of Noura looking gently toward the clinic optical sensor pod beside her in sunlit consultation room, authentic skin texture with zero overlays or digital boxes, serene relaxed smile',
    motionPrompt:
      'Photorealistic live-action micro-expression performance at 1x speed: Noura looks calmly toward the optical sensor, blinks softly, breathes smoothly, and her subtle facial tension dissolves naturally into quiet relief and peaceful comfort. Ultra-smooth slow dolly-in, zero jitter, strictly no boxes or text over face.',
    frameDeRaccordAr: 'الارتياح على وجه نورة ينعكس فوراً على ابتسامة د. سالم أمام النتيجة في P1-11.',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/real_p1_sc10_noura_emotion_1794690302225.jpg',
    voiceoverSegmentAr: 'يحلل نموذج Vision Transformer المحلي تعابير الوجه بدقة 91.66% وزمن 8.37 مللي ثانية.',
    keyMetricBadge: '10s · ViT 91.66% · FIG-03',
  },
  {
    id: 11,
    projectId: 'project1',
    code: 'P1-11',
    titleAr: 'التقرير الآلي Y-BOCS (تركيب FIG-04)',
    titleEn: 'Auto-Scored Y-BOCS Report (FIG-04)',
    timeRange: '1:40 - 1:50',
    startSec: 100,
    endSec: 110,
    durationSec: 10,
    recommendedVideoDuration: '10s',
    category: 'montage',
    categoryLabelAr: 'النتائج + Figma',
    characterAnchor: 'clinic_doctor',
    figmaOverlayCode: 'FIG-04',
    conceptAr:
      'د. سالم في مكتبه المنظم (وقد اختفت أكوام الأوراق) يراجع الشاشة بابتسامة اطمئنان عميق وهو يرى التقرير يصدر في أقل من ثانية (لتركيب FIG-04).',
    imagePrompt:
      'photorealistic medium shot of Dr. Salem seated comfortably at his uncluttered oak desk smiling warmly with genuine relief behind the brushed-aluminum monitor back (zero screen visible), warm morning window rays',
    motionPrompt:
      'Photorealistic live-action human performance at 1x speed: Dr. Salem glances calmly across the monitor screen unseen by camera, blinks naturally, exhales a quiet breath of relief as his shoulders relax comfortably back into his chair, and nods warmly with deep clinical assurance. Subtle horizontal dolly, zero jitter, no visible text.',
    frameDeRaccordAr: 'نظرة الرضا من د. سالم تفتح على المشهد الصباحي الواسع للعيادة النظيفة P1-12.',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/real_p1_sc11_doctor_report_1794690302604.jpg',
    voiceoverSegmentAr:
      'وفي أقل من ثانية، يكتمل التصحيح الآلي وتصدر تقارير Y-BOCS بدقة متوافقة مع معايير IEC 62304 و ISO 27001.',
    keyMetricBadge: '10s · < 1.0s · FIG-04',
  },
  {
    id: 12,
    projectId: 'project1',
    code: 'P1-12',
    titleAr: 'الاكتمال والهوية النهائية (تركيب FIG-05)',
    titleEn: 'Completion & Peaceful Clinic Finale (FIG-05)',
    timeRange: '1:50 - 2:00',
    startSec: 110,
    endSec: 120,
    durationSec: 10,
    recommendedVideoDuration: '10s',
    category: 'montage',
    categoryLabelAr: 'الختام + Figma',
    characterAnchor: 'tech_standalone',
    figmaOverlayCode: 'FIG-05',
    conceptAr:
      'لقطة معمارية واقعية واسعة لغرفة العيادة المشمسة بأشعة الصباح الذهبية ووحدة Raspberry Pi 5 الهادئة على الطاولة، مع جدار صافٍ تماماً في المنتصف لتركيب FIG-05 وشعار NoesisAI.',
    imagePrompt:
      'photorealistic wide sunlit modern mental health clinic room, clean oak desk in foreground with the compact white-and-sage Raspberry Pi 5 unit and warm ceramic mug, sunlit greenery outside blinds, broad spotless off-white wall intentionally blank for logo and UI overlay, zero people, zero text',
    motionPrompt:
      'Photorealistic live-action architectural motion at serene 1x pace: warm morning sunlight gently brightens across the clean plaster wall as indoor plant leaves sway very softly by the open window light while the gimbal glides smoothly upward and backward, opening generous space for logo and FIG-05 compositing. Zero jitter, strictly no text.',
    frameDeRaccordAr: 'تدرج ضوئي ذهبي ناعم يثبت الشاشة للخاتمة النهائية مع شعار NoesisAI.',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/real_p1_sc12_clinic_finale_1794690304099.jpg',
    voiceoverSegmentAr: 'NoesisAI… الذكاء الاصطناعي الآمن لخدمة الصحة النفسية.',
    keyMetricBadge: '10s · تركيب FIG-05',
  },
];

export const PROJECT_2_SCENES: PromoScene[] = [
  {
    id: 1,
    projectId: 'project2',
    code: 'P2-01',
    titleAr: 'نافذة المطر — عبء الساعات المتأخرة',
    titleEn: 'Rainy Dusk Window & Clinician Burden',
    timeRange: '0:00 - 0:12',
    startSec: 0,
    endSec: 12,
    durationSec: 12,
    recommendedVideoDuration: '10s',
    category: 'problem',
    categoryLabelAr: 'الفصل الأول: العزلة',
    characterAnchor: 'clinic_doctor',
    conceptAr:
      'مشهد افتتاحي أصلي بالكامل: غروب ممطر على نافذة العيادة ود. سالم يقف حاملاً ملفات بيضاء متراكمة تحت تباين الضوء البارد ومصباح المكتب الدافئ.',
    imagePrompt:
      'photorealistic 35mm anamorphic still at rainy dusk twilight, Dr. Salem standing thoughtfully beside a rain-streaked glass window holding heavy plain white binders over his cluttered shadowed desk lit by a warm brass lamp, zero text',
    motionPrompt:
      'Photorealistic live-action dramatic motion at 1x speed: soft rain droplets trickle slowly down the dark glass window behind Dr. Salem as he exhales slowly, shifts the weight of the white binders in his arms, blinks with quiet fatigue, and turns his gaze toward the darkened desk. Smooth slow sideways dolly, zero jitter, strictly no text.',
    frameDeRaccordAr: 'تلاشي أضواء المدينة الممطرة خلف الزجاج يقطع بسلاسة إلى الممر الزجاجي الضبابي حيث تقف نورة P2-02.',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/real_p2_sc01_rain_window_1794690317801.jpg',
    voiceoverSegmentAr: 'في نهاية كل يومٍ طويل… يجد الأخصائي نفسه غارقاً بين الأوراق لا بين الناس،',
    keyMetricBadge: '12s · واقعي · + صوت عربي',
  },
  {
    id: 2,
    projectId: 'project2',
    code: 'P2-02',
    titleAr: 'عتبة الباب الزجاجي — تردد نورة',
    titleEn: 'Frosted Clinic Corridor & Noura Hesitation',
    timeRange: '0:12 - 0:24',
    startSec: 12,
    endSec: 24,
    durationSec: 12,
    recommendedVideoDuration: '10s',
    category: 'problem',
    categoryLabelAr: 'الفصل الأول: العزلة',
    characterAnchor: 'clinic_patient',
    conceptAr:
      'في ممر العيادة الهادئ بإضاءة مسائية باردة: نورة تقف خارج الباب الزجاجي المصنفر ممسكةً بحزام حقيبتها بتردد إنساني صادق قبل الدخول.',
    imagePrompt:
      'photorealistic cool-toned clinic hallway medium shot of Noura standing hesitantly beside a translucent frosted glass clinic door holding her bag strap softly with both hands, subtle emotional vulnerability, zero text or signage',
    motionPrompt:
      'Photorealistic live-action human acting at 1x speed: Noura shifts her fingers subtly along the leather bag strap, inhales deeply to gather courage, blinks softly while glancing down then slowly lifting her eyes toward the frosted glass door beside her. Smooth gentle push-in, zero jitter, zero text.',
    frameDeRaccordAr: 'نظرة نورة المترددة نحو الباب تقطع مباشرة إلى حبر القلم الأحمر وضوء المصباح الدافئ في P2-03.',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/real_p2_sc02_frosted_door_1794690318439.jpg',
    voiceoverSegmentAr: 'وعلى العتبة الأخرى… مريضةٌ تحمل في صدرها ما تعجز الكلمات عن شرحه.',
    keyMetricBadge: '12s · واقعي · + صوت عربي',
  },
  {
    id: 3,
    projectId: 'project2',
    code: 'P2-03',
    titleAr: 'مصباح السهرة وتكرار التصحيح',
    titleEn: 'Desk Lamp & Endless Manual Clipboards',
    timeRange: '0:24 - 0:36',
    startSec: 24,
    endSec: 36,
    durationSec: 12,
    recommendedVideoDuration: '10s',
    category: 'problem',
    categoryLabelAr: 'الفصل الأول: العزلة',
    characterAnchor: 'clinic_doctor',
    conceptAr:
      'زاوية علوية درامية تحت ضوء المصباح النحاسي: يدا د. سالم تقلّبان دفاتر الاستبيانات الفارغة مع قلم أحمر بين الظلال الزرقاء.',
    imagePrompt:
      'high-angle photorealistic close-up under warm brass desk lamp against cool slate evening shadows, Dr. Salem tired hands resting beside stacked plain blank paper clipboards and a red ballpoint pen, zero readable text',
    motionPrompt:
      'Photorealistic live-action hand and shoulder motion at 1x speed: Dr. Salem slowly picks up the red ballpoint pen with weary fingers, flips back one blank clipboard page, pauses briefly while rubbing his thumb along the pen barrel, and lowers his head slightly in silent exhaustion. Smooth subtle tilt-down, zero jitter, strictly no readable text.',
    frameDeRaccordAr: 'بريق الظلام الأزرق على المكتب يتصاعد نحو خيوط الألياف الضوئية في P2-04.',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/real_p2_sc03_lamp_papers_1794690319140.jpg',
    voiceoverSegmentAr: 'ساعاتٌ تُستنزف في التصحيح اليدوي وتكرار الحسابات،',
    keyMetricBadge: '12s · واقعي · + صوت عربي',
  },
  {
    id: 4,
    projectId: 'project2',
    code: 'P2-04',
    titleAr: 'خيوط الألياف والمنشور المكسور',
    titleEn: 'Exposed Fiber Streams & Storm Cloud',
    timeRange: '0:36 - 0:48',
    startSec: 36,
    endSec: 48,
    durationSec: 12,
    recommendedVideoDuration: '10s',
    category: 'problem',
    categoryLabelAr: 'مخاطر الخصوصية',
    characterAnchor: 'tech_standalone',
    threeTechSceneId: 3,
    conceptAr:
      'تصوير مؤثرات بصرية ماكرو في أستوديو داكن: ألياف ضوئية متوهجة تصعد من حاسوب مغلق عبر منشور زجاجي أحمر متصدع نحو سحابة عاصفة.',
    imagePrompt:
      'photorealistic dark-studio VFX macro shot of luminous cyan optical fibers rising from a matte black silhouette laptop through a fractured crimson glass prism into a brooding volumetric storm cloud above, zero humans, zero text',
    motionPrompt:
      'Photorealistic optical VFX motion at steady dramatic pace: tiny pulses of cyan light travel upward along the delicate glass fibers through the rotating fractured crimson prism into swirling dark mist above. Smooth dolly glide, zero jitter, strictly no humans or text.',
    frameDeRaccordAr: 'انقطاع الخيوط المضيئة في العتمة يكشف عن نقطة ضوء خضراء صامتة تولد في الفجر P2-05.',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/real_p2_sc04_fiber_cloud_1794690320443.jpg',
    voiceoverSegmentAr: 'وخصوصيةٌ تبقى على المحك متى غادرت بيانات الجلسات جدران العيادة.',
    keyMetricBadge: '12s · VFX / 3D + صوت عربي',
  },
  {
    id: 5,
    projectId: 'project2',
    code: 'P2-05',
    titleAr: 'وقفة موسيقية صامتة ١ — نبض الفجر الأخضر',
    titleEn: 'Silent Musical Beat 1: Dawn LED Pulse',
    timeRange: '0:48 - 1:00',
    startSec: 48,
    endSec: 60,
    durationSec: 12,
    recommendedVideoDuration: '10s',
    category: 'hardware',
    categoryLabelAr: 'نقطة التحول',
    characterAnchor: 'tech_standalone',
    isSilentMusicalBeat: true,
    conceptAr:
      'وقفة موسيقية صامتة (بيانو ووتريات دافئة بدون تعليق): ماكرو سينمائي في ضوء الفجر الهادئ لوحدة Raspberry Pi 5 تستيقظ بمؤشر LED أخضر دافئ.',
    imagePrompt:
      'photorealistic 85mm macro cinema still in calm pre-dawn twilight, intimate close-up of the white and sage-green Raspberry Pi 5 unit and mounted camera pod as its crisp emerald green LED glows softly on brushed ports, zero text',
    motionPrompt:
      'Photorealistic live-action macro camera orbit (Silent Musical Beat, no speech): in quiet pre-dawn stillness, the crisp emerald LED light softly breathes and illuminates the matte-white surface and optical camera lens while first blue-gold dawn light warms the wooden desk edge. Ultra-smooth slow arc track, zero jitter, strictly no text.',
    frameDeRaccordAr: 'انتشار ضوء الفجر الدافئ يكشف كامل النظام على طاولة البلوط في شمس الصباح P2-06.',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/real_p2_sc05_dawn_led_1794690320564.jpg',
    voiceoverSegmentAr: '【وقفة موسيقية صامتة ١ — نغمة بيانو دافئة تعلن بداية الحل المحلي】',
    keyMetricBadge: '12s · وقفة موسيقية ١',
  },
  {
    id: 6,
    projectId: 'project2',
    code: 'P2-06',
    titleAr: 'شمس الصباح على جهاز NoesisAI المستقل',
    titleEn: 'Morning Sunlight on Offline Pi 5 System',
    timeRange: '1:00 - 1:12',
    startSec: 60,
    endSec: 72,
    durationSec: 12,
    recommendedVideoDuration: '10s',
    category: 'hardware',
    categoryLabelAr: 'الحل المحلي',
    characterAnchor: 'tech_standalone',
    threeTechSceneId: 4,
    conceptAr:
      'أشعة شمس الصباح الذهبية تنساب على طاولة البلوط حول وحدة Raspberry Pi 5 والكاميرا وشاشة التابلت النعناعية الصافية — محلية 100% بلا أسلاك شبكة.',
    imagePrompt:
      'photorealistic low-angle morning sunlight shot on natural oak desk featuring the white and sage-green Raspberry Pi 5 unit, compact optical camera pod, and pure blank pastel-mint touchscreen tablet completely offline, sunlit plant shadows, zero text',
    motionPrompt:
      'Photorealistic cinema slider shot at 1x pace: warm morning sunbeams drift imperceptibly across the wooden grain while camera glides smoothly left-to-right past the quiet glowing emerald LED and clean blank pastel-mint glass tablet. Zero jitter, strictly no screen text.',
    frameDeRaccordAr: 'امتداد الضوء عبر الزجاج يتجسد حول الوحدة كقبة حماية زمردية صلبة في P2-07.',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/real_p2_sc06_oak_hardware_1794690334589.jpg',
    voiceoverSegmentAr: 'حتى وُلد NoesisAI: عقلٌ ذكي ينبض على Raspberry Pi 5 داخل غرفتك وحدك،',
    keyMetricBadge: '12s · واقعي / 3D + صوت عربي',
  },
  {
    id: 7,
    projectId: 'project2',
    code: 'P2-07',
    titleAr: 'قبة الزجاج الزمردي والقفل الفولاذي',
    titleEn: 'Emerald Optical Dome & Steel Padlock',
    timeRange: '1:12 - 1:24',
    startSec: 72,
    endSec: 84,
    durationSec: 12,
    recommendedVideoDuration: '10s',
    category: 'hardware',
    categoryLabelAr: 'الأمان والخصوصية',
    characterAnchor: 'tech_standalone',
    threeTechSceneId: 5,
    conceptAr:
      'قبة زجاجية زمردية شفافة تغلف وحدة الجهاز وشاشة المريض مع قفل فولاذي متين في الأعلى في ضوء عيادة مشرق وهادئ.',
    imagePrompt:
      'photorealistic sunlit clinic VFX shot of the Raspberry Pi 5 and blank pastel-mint tablet encased cleanly inside a translucent emerald optical glass dome crowned by a closed brushed stainless-steel padlock, sunlit indoor plants behind, zero humans, zero text',
    motionPrompt:
      'Photorealistic optical VFX animation: morning light refracts cleanly along the curved emerald glass dome while the brushed steel padlock above drops softly and locks tight with a crisp subtle gleam. Smooth stabilized push-in, zero jitter, strictly no text.',
    frameDeRaccordAr: 'صفاء الضوء خلف القبة يفتح على مكتب د. سالم الصباحي المشرق في P2-08.',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/real_p2_sc07_glass_sanctuary_1794690335982.jpg',
    voiceoverSegmentAr: 'مغلقٌ تماماً على الشبكة الخارجية، محصّن بتشفيرٍ محلي ومعايير ISO 27001.',
    keyMetricBadge: '12s · VFX / 3D + صوت عربي',
  },
  {
    id: 8,
    projectId: 'project2',
    code: 'P2-08',
    titleAr: 'ضوء الصباح وبوابة الأخصائي (FIG-01)',
    titleEn: 'Sunlit Desk & Doctor Login (FIG-01)',
    timeRange: '1:24 - 1:36',
    startSec: 84,
    endSec: 96,
    durationSec: 12,
    recommendedVideoDuration: '10s',
    category: 'montage',
    categoryLabelAr: 'العيادة + Figma',
    characterAnchor: 'clinic_doctor',
    figmaOverlayCode: 'FIG-01',
    conceptAr:
      'لقطة جانبية مشرقة عند مستوى العين: د. سالم في مكتبه الصافي المضيء يبدأ الجلسة أمام شاشة بيضاء صافية 100% (تركيب FIG-01).',
    imagePrompt:
      'photorealistic eye-level three-quarter shot of Dr. Salem seated comfortably in morning sunlight through window blinds facing a pure solid blank white monitor display, hand resting gently on keyboard, zero UI or text',
    motionPrompt:
      'Photorealistic live-action performance at 1x speed: Dr. Salem sits with calm morning energy, lightly taps the key once with his fingertips, blinks warmly, and settles his posture calmly before the pure blank white display. Steady horizontal track, zero jitter, white screen stays pure and steady.',
    frameDeRaccordAr: 'عند ضغطة البدء، انتقال قريب مباشر إلى نظرة د. سالم نحو عدسة الكاميرا P2-09.',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/real_p2_sc08_blinds_login_1794690335068.jpg',
    voiceoverSegmentAr: 'بنظرةٍ واحدة عبر الكاميرا المثبتة، يستعيد الأخصائي وقته الثمين،',
    keyMetricBadge: '12s · تركيب FIG-01',
  },
  {
    id: 9,
    projectId: 'project2',
    code: 'P2-09',
    titleAr: 'نظرة الأمان نحو العدسة (VGG-Face + FIG-02)',
    titleEn: 'Trusted Optical Gaze & Scale Ready (FIG-02)',
    timeRange: '1:36 - 1:48',
    startSec: 96,
    endSec: 108,
    durationSec: 12,
    recommendedVideoDuration: '10s',
    category: 'biometric',
    categoryLabelAr: 'التحقق البيومتري',
    characterAnchor: 'clinic_doctor',
    figmaOverlayCode: 'FIG-02',
    conceptAr:
      'لقطة بورتريه واقعية حميمية لد. سالم أمام وحدة الكاميرا البيضاء المثبتة (بدون أي شبكة على الوجه) — يتحقق النظام في أجزاء من الثانية بدقة 89.09% ويبتسم بترحيب.',
    imagePrompt:
      'photorealistic 85mm close-up portrait of Dr. Salem looking warmly toward the blurred white optical camera pod in lower foreground corner, natural skin texture without any painted lines or grids, subtle green reflection on eyeglasses rim',
    motionPrompt:
      'Photorealistic live-action acting at 1x speed: Dr. Salem looks warmly toward the foreground optical camera lens, blinks naturally once, a faint soft green reflection passes gently across his eyeglass rim, and his expression opens into an authentic reassuring smile with a gentle welcoming head nod. Zero jitter, strictly clean skin.',
    frameDeRaccordAr: 'ابتسامة د. سالم المرحبة تفتح الباب لدخول نورة وجلوسها براحة في P2-10.',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/real_p2_sc09_doctor_sensor_1794690338283.jpg',
    voiceoverSegmentAr: 'بعد التحقق البيومتري الآمن بدقة 89.09%، ليمنح اهتمامه الكامل للإنسان أمامه.',
    keyMetricBadge: '12s · VGG-Face 89.09% · FIG-02',
  },
  {
    id: 10,
    projectId: 'project2',
    code: 'P2-10',
    titleAr: 'الجلوس في غرفة الاطمئنان',
    titleEn: 'Noura Settles Into Calm Consultation',
    timeRange: '1:48 - 2:00',
    startSec: 108,
    endSec: 120,
    durationSec: 12,
    recommendedVideoDuration: '10s',
    category: 'biometric',
    categoryLabelAr: 'بوابة المريض',
    characterAnchor: 'clinic_patient',
    conceptAr:
      'نورة الآن داخل غرفة العيادة المشرقة، تجلس بهدوء في المقعد المريح وتنظر بأمل متجدد نحو الشاشة اللوحية النعناعية الصافية ووحدة الكاميرا.',
    imagePrompt:
      'photorealistic medium wide shot inside sunlit consultation room of Noura sitting relaxed in the soft armchair turning peacefully toward the oak side table holding the pure blank pastel-mint tablet and Raspberry Pi 5 camera unit, zero text',
    motionPrompt:
      'Photorealistic live-action human motion at 1x speed: Noura unclasps her shoulders softly, breathes deeply with visible comfort, blinks naturally, and turns her calm eyes with gentle curiosity toward the clean glowing pastel-mint tablet on the wooden table. Smooth gentle dolly-in, zero jitter, strictly no screen text.',
    frameDeRaccordAr: 'نظرة نورة نحو الجهاز اللوحي تنتقل بسلاسة إلى لقطة من فوق كتفها لحظة اللمس P2-11.',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/real_p2_sc10_noura_enters_1794690337845.jpg',
    voiceoverSegmentAr: 'تجلس نورة للمرة الأولى دون توتر… أمام واجهةٍ صُممت لراحتها وخصوصيتها،',
    keyMetricBadge: '12s · واقعي · + صوت عربي',
  },
  {
    id: 11,
    projectId: 'project2',
    code: 'P2-11',
    titleAr: 'أطراف الأصابع على الشاشة النقية',
    titleEn: 'Noura Fingertips on Mint Touchscreen',
    timeRange: '2:00 - 2:12',
    startSec: 120,
    endSec: 132,
    durationSec: 12,
    recommendedVideoDuration: '10s',
    category: 'biometric',
    categoryLabelAr: 'تفاعل المريضة',
    characterAnchor: 'clinic_patient',
    conceptAr:
      'لقطة قريبة من فوق كتف نورة في ضوء الشمس الدافئ: أصابعها تلامس زجاج الشاشة النعناعية الصافية برفق وثقة بجوار وحدة Raspberry Pi 5.',
    imagePrompt:
      'over-the-shoulder photorealistic sunlit close-up of Noura delicately tapping the pure blank pastel-mint glass tablet beside the compact white-and-sage Raspberry Pi 5 unit and camera lens, shallow depth of field, zero screen text',
    motionPrompt:
      'Photorealistic live-action tactile performance at 1x speed: Noura extends her right hand smoothly in warm window sunlight, gently taps the clean pastel-mint glass twice with soft natural finger motion, holds briefly with calm steadiness, and relaxes her arm smoothly. Steady cinema close-up, zero jitter, strictly blank screen.',
    frameDeRaccordAr: 'مع لمسة الإصبع المطمئنة، تلتف الكاميرا نحو ملامح نورة الذهبية لتنطق بصدق في P2-12.',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/real_p2_sc11_noura_fingertips_1794690352351.jpg',
    voiceoverSegmentAr: 'تُجيب خطوةً بخطوة على الأسئلة بسلاسة ووضوح،',
    keyMetricBadge: '12s · واقعي · + صوت عربي',
  },
  {
    id: 12,
    projectId: 'project2',
    code: 'P2-12',
    titleAr: 'اللحظة الذهبية ومزامنة الشفاه (FIG-03)',
    titleEn: 'Noura Speaks Hope + ViT Emotion (FIG-03)',
    timeRange: '2:12 - 2:26',
    startSec: 132,
    endSec: 146,
    durationSec: 14,
    recommendedVideoDuration: '10s',
    category: 'biometric',
    categoryLabelAr: 'ذروة الأداء والليب-سنك',
    characterAnchor: 'clinic_patient',
    figmaOverlayCode: 'FIG-03',
    lipSyncTargetAr: 'أخيراً… أحد يفهمني دون خوف',
    conceptAr:
      'الذروة العاطفية بالضوء الذهبي: بورتريه حقيقي لنورة بملامح صافية وعينين دامعتين بالأمل تنطق بمزامنة شفاه عربية دقيقة: «أخيراً… أحد يفهمني دون خوف» بينما يلتقط ViT مشاعرها بدقة 91.66% (تركيب FIG-03).',
    imagePrompt:
      'photorealistic golden-hour 85mm cinema portrait of Noura bathed in warm afternoon sunlight, expressive dark eyes shining with relief and gratitude, parted lips in gentle heartfelt half-smile, clean natural face with zero grids or text',
    motionPrompt:
      'Photorealistic live-action acting & true Arabic Lip-Sync at 1x speed: bathed in golden-hour window rays, Noura blinks softly with hopeful glistening eyes, inhales a quiet emotional breath, and naturally speaks the Arabic phrase "أخيراً… أحد يفهمني دون خوف" with accurate jaw, tongue, and lip articulation, settling into a radiant peaceful smile. Smooth gentle push-in, zero jitter, strictly clean natural skin.',
    frameDeRaccordAr: 'الابتسامة الصادقة في الضوء الذهبي تفتح على اللقطة الثنائية التي تجمع نورة ود. سالم في P2-13.',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/real_p2_sc12_noura_speaks_hope_1794690353256.jpg',
    voiceoverSegmentAr:
      'نورة (بصوتها المباشر): «أخيراً… أحد يفهمني دون خوف» — بينما يلتقط Vision Transformer مشاعرها بدقة 91.66% وزمن 8.37 مللي ثانية.',
    keyMetricBadge: '14s · Lip-Sync + ViT 91.66%',
  },
  {
    id: 13,
    projectId: 'project2',
    code: 'P2-13',
    titleAr: 'حوار الأمل والتقرير الفوري (FIG-04)',
    titleEn: 'Shared Clinical Relief & Report (FIG-04)',
    timeRange: '2:26 - 2:44',
    startSec: 146,
    endSec: 164,
    durationSec: 18,
    recommendedVideoDuration: '10s',
    category: 'montage',
    categoryLabelAr: 'النتائج + Figma',
    characterAnchor: 'clinic_doctor',
    figmaOverlayCode: 'FIG-04',
    conceptAr:
      'لقطة ثنائية واقعية مفعمة بالإنسانية: د. سالم ونورة يجلسان عبر طاولة البلوط المضيئة في تواصل بصري دافئ ومطمئن بعد صدور تقرير Y-BOCS في أقل من ثانية (لتركيب FIG-04).',
    imagePrompt:
      'photorealistic warm sunlit cinema two-shot across the clean wooden clinic desk showing Dr. Salem beside the back of his silver monitor (screen hidden from camera) sharing a warm reassuring smile with Noura seated happily opposite him, zero text',
    motionPrompt:
      'Photorealistic live-action two-person interaction at 1x speed: Dr. Salem glances briefly toward the hidden monitor then meets Noura eyes with a warm compassionate smile and reassuring nod, while Noura smiles back calmly with relaxed shoulders and subtle natural hand movement on the desk edge. Smooth gentle pullback dolly, zero jitter, strictly no text.',
    frameDeRaccordAr: 'انسحاب هادئ من طاولة الحوار نحو الغرفة المشمسة كاملة وجهاز NoesisAI في P2-14.',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/real_p2_sc13_shared_relief_1794690354837.jpg',
    voiceoverSegmentAr:
      'وفي أقل من ثانية، تكتمل الصورة السريرية بدقة IEC 62304… ليصبح التقييم بدايةَ تعافٍ حقيقي.',
    keyMetricBadge: '18s · < 1.0s · FIG-04',
  },
  {
    id: 14,
    projectId: 'project2',
    code: 'P2-14',
    titleAr: 'وقفة موسيقية ٢ — ملاذ العيادة الذهبي (FIG-05)',
    titleEn: 'Silent Musical Finale & Golden Sanctuary (FIG-05)',
    timeRange: '2:44 - 3:02',
    startSec: 164,
    endSec: 182,
    durationSec: 18,
    recommendedVideoDuration: '10s',
    category: 'montage',
    categoryLabelAr: 'الختام الذهبي',
    characterAnchor: 'tech_standalone',
    figmaOverlayCode: 'FIG-05',
    isSilentMusicalBeat: true,
    conceptAr:
      'وقفة موسيقية ثانية وخاتمة الإعلان: شمس الغروب الذهبية تغمر قاعة الاستشارة الهادئة والنوافذ الخضراء، مع وحدة Raspberry Pi 5 مستقرة على الطاولة ومساحة بيضاء مشمسة صافية لتركيب FIG-05 والشعار.',
    imagePrompt:
      'photorealistic golden-hour wide architectural still of serene minimalist consultation room with floor-to-ceiling windows overlooking lush trees, clean oak table holding the quiet white-and-sage Raspberry Pi 5 unit and small plant, broad blank sunlit plaster wall ready for logo and FIG-05 overlay, zero people, zero text',
    motionPrompt:
      'Photorealistic live-action architectural finale (Warm Piano Swell & Finale): golden sunset sunbeams gradually deepen and warm across the spotless plaster wall while outdoor green trees sway gently beyond the window glass and the camera drifts smoothly upward and backward, framing pure clean space for the NoesisAI logo and FIG-05 card. Zero jitter, strictly no text.',
    frameDeRaccordAr: 'تثبيت اللقطة الخاتمة 4 ثوانٍ لظهور شعار «NoesisAI — رحلة الطمأنينة» على الموسيقى الختامية.',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/real_p2_sc14_golden_sanctuary_1794690354939.jpg',
    voiceoverSegmentAr: 'NoesisAI… من العزلة إلى الثقة. الذكاء الاصطناعي الآمن للصحة النفسية.',
    keyMetricBadge: '18s · وقفة ٢ + FIG-05',
  },
];

export const PROJECT_1_VOICEOVER_AR = `تعتمد العيادات النفسية حتى يومنا هذا على الاستبيانات الورقية التقليدية؛ مما يسبب ضغطاً كبيراً على الأخصائي، وبطء التقييم، وأخطاء التصحيح اليدوي المتكررة، فضلاً عن مخاطر تسريب بيانات المرضى الحساسة عند تخزينها عبر الإنترنت.
من هنا جاء الابتكار: NoesisAI؛ النظام الذكي المدمج بالكامل على جهاز Raspberry Pi 5، والذي يعمل محلياً داخل العيادة دون أي اتصال بالإنترنت لضمان الخصوصية المطلقة.
بلمسة واحدة، يفتح الأخصائي بوابة النظام، ويسجّل دخوله بأمان تام عبر التحقق البيومتري للوجه بدقة 89.09%، ليختار ملف المريض والمقياس النفسي المعتمد مثل Y-BOCS أو BDI أو TMAS.
أثناء إجابة المريض بارتياح عبر شاشة اللمس المخصصة، يحلل نموذج Vision Transformer المحلي تعابير الوجه بدقة 91.66% وزمن 8.37 مللي ثانية.
وفي أقل من ثانية، يكتمل التصحيح الآلي وتصدر تقارير Y-BOCS بدقة متوافقة مع معايير IEC 62304 و ISO 27001.
NoesisAI… الذكاء الاصطناعي الآمن لخدمة الصحة النفسية.`;

export const PROJECT_2_VOICEOVER_AR = `[0:00 - 0:48 | الفصل الأول: العزلة تحت المطر]
في نهاية كل يومٍ طويل… يجد الأخصائي نفسه غارقاً بين الأوراق لا بين الناس، وعلى العتبة الأخرى… مريضةٌ تحمل في صدرها ما تعجز الكلمات عن شرحه.
ساعاتٌ تُستنزف في التصحيح اليدوي وتكرار الحسابات، وخصوصيةٌ تبقى على المحك متى غادرت بيانات الجلسات جدران العيادة.

[0:48 - 1:00 | وقفة موسيقية صامتة ١ — نبض الفجر الأخضر]
(صمت تعليق كامل — بيانو دافئ ووتريات ناعمة مع استيقاظ مؤشر Raspberry Pi 5 الأخضر في الفجر)

[1:00 - 2:12 | الفصل الثاني: ولادة الثقة داخل العيادة]
حتى وُلد NoesisAI: عقلٌ ذكي ينبض على Raspberry Pi 5 داخل غرفتك وحدك، مغلقٌ تماماً على الشبكة الخارجية، محصّن بتشفيرٍ محلي ومعايير ISO 27001.
بنظرةٍ واحدة عبر الكاميرا المثبتة، يستعيد الأخصائي وقته الثمين بعد التحقق البيومتري الآمن بدقة 89.09%، ليمنح اهتمامه الكامل للإنسان أمامه.
تجلس نورة للمرة الأولى دون توتر… أمام واجهةٍ صُممت لراحتها وخصوصيتها، تُجيب خطوةً بخطوة على الأسئلة بسلاسة ووضوح.

[2:12 - 2:26 | اللحظة الذهبية — Lip-Sync عربي مباشر]
نورة (بصوتها المباشر): «أخيراً… أحد يفهمني دون خوف.» — بينما يلتقط Vision Transformer مشاعرها بدقة 91.66% وزمن 8.37 مللي ثانية.

[2:26 - 3:02 | الفصل الثالث: ملاذ الطمأنينة]
وفي أقل من ثانية، تكتمل الصورة السريرية بدقة IEC 62304… ليصبح التقييم بدايةَ تعافٍ حقيقي.
(وقفة موسيقية ٢ — غروب ذهبي في العيادة)
NoesisAI… من العزلة إلى الثقة. الذكاء الاصطناعي الآمن للصحة النفسية.`;

export const PROJECT_1_SUBTITLES: SubtitleCue[] = [
  {
    id: 1,
    timeRange: '0:00 - 0:20',
    startSec: 0,
    endSec: 20,
    textEn:
      'Psychological clinics still rely on paper questionnaires—causing heavy clinician workload, slow evaluations, and repeated manual scoring errors.',
    textArHint: 'P1-01 و P1-02: الاستبيانات الورقية وأخطاء التصحيح اليدوي.',
  },
  {
    id: 2,
    timeRange: '0:20 - 0:30',
    startSec: 20,
    endSec: 30,
    textEn:
      'Worse still, storing sensitive patient records in the cloud exposes mental health data to serious privacy risks.',
    textArHint: 'P1-03: مخاطر تسريب البيانات عبر السحابة.',
  },
  {
    id: 3,
    timeRange: '0:30 - 0:50',
    startSec: 30,
    endSec: 50,
    textEn:
      'Introducing NoesisAI: edge AI powered by Raspberry Pi 5, operating 100% offline inside the clinic for absolute data privacy.',
    textArHint: 'P1-04 و P1-05: جهاز Raspberry Pi 5 والقبة الأوفلاين.',
  },
  {
    id: 4,
    timeRange: '0:50 - 1:20',
    startSec: 50,
    endSec: 80,
    textEn:
      'With one click, the clinician logs in via 89.09% accurate Face ID and selects validated scales such as Y-BOCS, BDI, or TMAS.',
    textArHint: 'P1-06 إلى P1-08: شاشة الدخول، Face ID، واختيار المقياس.',
  },
  {
    id: 5,
    timeRange: '1:20 - 1:40',
    startSec: 80,
    endSec: 100,
    textEn:
      'As the patient answers comfortably on the touchscreen, the local Vision Transformer reads emotions in real time at 91.66% accuracy and 8.37 ms.',
    textArHint: 'P1-09 و P1-10: شاشة اللمس وتحليل ViT اللحظي.',
  },
  {
    id: 6,
    timeRange: '1:40 - 2:00',
    startSec: 100,
    endSec: 120,
    textEn:
      'Under 1 second, automated Y-BOCS reports are generated under IEC 62304 & ISO 27001. NoesisAI—Secure AI for Mental Health.',
    textArHint: 'P1-11 و P1-12: التقرير الآلي والاكتمال.',
  },
];

export const PROJECT_2_SUBTITLES: SubtitleCue[] = [
  {
    id: 1,
    timeRange: '0:00 - 0:24',
    startSec: 0,
    endSec: 24,
    textEn:
      'At the end of a long day, a clinician drowns in paperwork instead of people—while across the threshold, a patient carries what words cannot explain.',
    textArHint: 'P2-01 و P2-02: نافذة المطر وتردد نورة عند الباب.',
  },
  {
    id: 2,
    timeRange: '0:24 - 0:48',
    startSec: 24,
    endSec: 48,
    textEn:
      'Hours lost to manual scoring, and deep privacy left exposed whenever clinical records travel beyond clinic walls.',
    textArHint: 'P2-03 و P2-04: مصباح السهرة وخيوط الألياف.',
  },
  {
    id: 3,
    timeRange: '1:00 - 1:24',
    startSec: 60,
    endSec: 84,
    textEn:
      'Until NoesisAI arrived: intelligent care running locally on Raspberry Pi 5, sealed offline inside your room with ISO 27001 security.',
    textArHint: 'P2-06 و P2-07: شمس الصباح وقبة الزجاج الزمردي.',
  },
  {
    id: 4,
    timeRange: '1:24 - 2:12',
    startSec: 84,
    endSec: 132,
    textEn:
      'After 89.09% accurate biometric sign-in, the doctor gives full attention to the person ahead—as Noura answers calmly at her own pace.',
    textArHint: 'P2-08 إلى P2-11: نظرة الأمان، الجلسة المريحة، ولمسة الشاشة.',
  },
  {
    id: 5,
    timeRange: '2:12 - 2:26',
    startSec: 132,
    endSec: 146,
    textEn:
      '“Finally… someone understands me without fear.” — captured by local Vision Transformer at 91.66% accuracy in 8.37 ms.',
    textArHint: 'P2-12: جملة نورة المنطوقة بمزامنة الشفاه + تحليل ViT.',
  },
  {
    id: 6,
    timeRange: '2:26 - 2:44',
    startSec: 146,
    endSec: 164,
    textEn:
      'In under one second, the clinical picture completes under IEC 62304—turning assessment into the beginning of real healing.',
    textArHint: 'P2-13: حوار الأمل المشترك والتقرير الفوري.',
  },
  {
    id: 7,
    timeRange: '2:44 - 3:02',
    startSec: 164,
    endSec: 182,
    textEn: 'NoesisAI — From Isolation to Trust. Secure AI for Mental Health.',
    textArHint: 'P2-14: ملاذ العيادة الذهبي والخاتمة.',
  },
];

export const PROJECTS: Record<ProjectId, ProjectDefinition> = {
  project1: {
    id: 'project1',
    nameAr: 'المشروع الأول: الإنتاج الواقعي (12 مشهداً · 120s)',
    shortNameAr: 'المشروع الأول (12 مشهداً)',
    subtitleAr:
      'نفس المشاهد الـ 12 بإنتاج سينمائي واقعي حي (Live-Action 1080p) مع برومبتات Grok متكاملة بالصوت العربي، وصور مرجعية متناسقة وشاشات Figma المقصوصة.',
    totalDurationSec: 120,
    scenes: PROJECT_1_SCENES,
    voiceoverScriptAr: PROJECT_1_VOICEOVER_AR,
    subtitlesEn: PROJECT_1_SUBTITLES,
  },
  project2: {
    id: 'project2',
    nameAr: 'المشروع الثاني: «رحلة الطمأنينة» (14 مشهداً · 182s)',
    shortNameAr: 'المشروع الثاني (14 مشهداً)',
    subtitleAr:
      'إنتاج أصلي من الصفر بـ 14 مشهداً واقعياً جديداً (من المطر والمساء البارد إلى الغروب الذهبي)، وقفتان موسيقيتان، وبرومبتات Grok مع صوت عربي وليب-سنك نورة.',
    totalDurationSec: 182,
    scenes: PROJECT_2_SCENES,
    voiceoverScriptAr: PROJECT_2_VOICEOVER_AR,
    subtitlesEn: PROJECT_2_SUBTITLES,
  },
};

export const PROMO_SCENES: PromoScene[] = PROJECT_1_SCENES;
export const FULL_VOICEOVER_SCRIPT_AR = PROJECT_1_VOICEOVER_AR;
export const CAPCUT_SUBTITLES: SubtitleCue[] = PROJECT_1_SUBTITLES;

export const FIGMA_REFERENCE_SCREENS: FigmaReferenceScreen[] = [
  {
    id: 1,
    code: 'FIG-01',
    titleAr: 'شاشة تسجيل الدخول (مقصوصة بدقة 1080p)',
    conceptAr: 'لقطة Figma نظيفة خالية من تبويبات المتصفح وشريط Figma الجانبي — جاهزة للتركيب فوق الشاشة البيضاء في مشهد الدخول.',
    imagePath: '/assets/figma-clean/FIG-01_Landing_Login.png',
    filename: 'FIG-01_Landing_Login.png',
  },
  {
    id: 2,
    code: 'FIG-02',
    titleAr: 'اختيار المريض والاختبارات المعيارية (مقصوصة بدقة 1080p)',
    conceptAr: 'لقطة Figma نظيفة لمقاييس Y-BOCS و BDI و TMAS — جاهزة للمونتاج الخارجي في CapCut.',
    imagePath: '/assets/figma-clean/FIG-02_Patient_Assessment_Select.png',
    filename: 'FIG-02_Patient_Assessment_Select.png',
  },
  {
    id: 3,
    code: 'FIG-03',
    titleAr: 'تحليل تعابير الوجه ViT (مقصوصة بدقة 1080p)',
    conceptAr: 'لقطة Figma نظيفة لنافذة تحليل المشاعر السبعة اللحظي بدقة 91.66% — للمونتاج الخارجي.',
    imagePath: '/assets/figma-clean/FIG-03_Biometric_Face_Analysis.png',
    filename: 'FIG-03_Biometric_Face_Analysis.png',
  },
  {
    id: 4,
    code: 'FIG-04',
    titleAr: 'تقرير Y-BOCS والمؤشرات (مقصوصة بدقة 1080p)',
    conceptAr: 'لقطة Figma نظيفة لتقرير الدرجات المصحح آلياً — للمونتاج الخارجي في مشهد التقرير.',
    imagePath: '/assets/figma-clean/FIG-04_YBOCS_Score_Report.png',
    filename: 'FIG-04_YBOCS_Score_Report.png',
  },
  {
    id: 5,
    code: 'FIG-05',
    titleAr: 'شاشة الإتمام والمعايير (مقصوصة بدقة 1080p)',
    conceptAr: 'لقطة Figma نظيفة لشاشة إنهاء التقييم والاطمئنان — للتركيب في المشهد الختامي.',
    imagePath: '/assets/figma-clean/FIG-05_Assessment_Complete.png',
    filename: 'FIG-05_Assessment_Complete.png',
  },
];

export const MODEL_BENCHMARKS: ModelBenchmark[] = [
  {
    task: 'FER',
    modelName: 'mo-thecreator/vit-Facial-Expression-Recognition (ViT)',
    dataset: 'FER-2013 (7,178 test) / CK+ (708)',
    accuracy: '91.66%',
    secondaryMetricLabel: 'Macro-F1 / ROC-AUC',
    secondaryMetricValue: '0.92 / 0.98',
    inferenceTimeMs: '8.37 ms',
    selected: true,
    notesAr: 'النتيجة النهائية المعتمدة في الفصل الرابع والملخص — أعلى دقة على FER-2013 بزمن استدلال 8.37 مللي ثانية.',
  },
  {
    task: 'FER',
    modelName: 'dima806/facial_emotions_image_detection (CNN)',
    dataset: 'FER-2013 (7,178 test)',
    accuracy: '88.35%',
    secondaryMetricLabel: 'Macro-F1',
    secondaryMetricValue: '0.89',
    inferenceTimeMs: '8.24 ms',
    selected: false,
    notesAr: 'نموذج CNN خفيف الوزن؛ تفوق عليه نموذج ViT بفارق +3.31 نقطة مئوية.',
  },
  {
    task: 'FER',
    modelName: 'DeepFace Default FER (Baseline)',
    dataset: 'FER-2013 (7,178 test)',
    accuracy: '55.22%',
    secondaryMetricLabel: 'CK+ Accuracy',
    secondaryMetricValue: '57.91%',
    inferenceTimeMs: '13.95 ms',
    selected: false,
    notesAr: 'النموذج المرجعي العام؛ أظهر أداءً أضعف خاصة في فئتي الخوف والاشمئزاز.',
  },
  {
    task: 'FV',
    modelName: 'DeepFace VGG-Face',
    dataset: 'LFW (2,200 balanced pairs)',
    accuracy: '89.09%',
    secondaryMetricLabel: 'TPR / TNR / Precision',
    secondaryMetricValue: '0.79 / 0.99 / 0.99',
    inferenceTimeMs: '129.69 ms',
    selected: true,
    notesAr: 'النتيجة النهائية المعتمدة لمصادقة الأخصائي في الفصل الرابع مع دقة منع انتحال TNR = 0.99.',
  },
  {
    task: 'FV',
    modelName: 'DeepFace SFace',
    dataset: 'LFW (2,200 balanced pairs)',
    accuracy: '86.36%',
    secondaryMetricLabel: 'TPR / TNR / Precision',
    secondaryMetricValue: '0.73 / 0.99 / 0.99',
    inferenceTimeMs: '90.81 ms',
    selected: false,
    notesAr: 'أسرع بنسبة ~30% من VGG-Face مع دقة إيجابية مطابقة 0.99 ومنع عالٍ للدخول غير المصرح.',
  },
];

export const MEDICAL_STANDARDS: MedicalStandard[] = [
  {
    code: 'IEC 62304',
    titleAr: 'دورة حياة برمجيات الأجهزة الطبية',
    titleEn: 'Medical Device Software Lifecycle',
    scopeAr: 'حوكمة تطوير البرمجيات الطبية، التتبع، والتحقق من خوارزميات التصحيح والنماذج.',
  },
  {
    code: 'ISO 14971',
    titleAr: 'إدارة المخاطر للأجهزة الطبية',
    titleEn: 'Medical Device Risk Management',
    scopeAr: 'تقييم مخاطر البيانات الحساسة، عدم التشخيص الآلي المنفرد، وبدائل المصادقة البيومترية.',
  },
  {
    code: 'ISO/IEC 27001',
    titleAr: 'إدارة أمن المعلومات والخصوصية',
    titleEn: 'Information Security Management',
    scopeAr: 'التشغيل دون اتصال (Offline LAN)، تشفير AES-256-CBC، وسجلات التدقيق Append-Only.',
  },
  {
    code: 'IEC 62366-1',
    titleAr: 'هندسة قابلية الاستخدام الطبية',
    titleEn: 'Usability Engineering',
    scopeAr: 'واجهات واضحة للمريض والأخصائي لتقليل العبء المعرفي وأخطاء الإدخال.',
  },
  {
    code: 'WCAG 2.1 AA',
    titleAr: 'إمكانية الوصول للشاشات اللمسية',
    titleEn: 'Patient Portal Accessibility',
    scopeAr: 'أزرار لمس كبيرة، تباين لوني مدروس، وعرض سؤال واحد في كل مرة.',
  },
  {
    code: 'HL7 FHIR',
    titleAr: 'قابلية التشغيل البيني للسجلات الطبية',
    titleEn: 'Healthcare Interoperability',
    scopeAr: 'جاهزية التكامل المستقبلي مع أنظمة السجلات الصحية الإلكترونية (EHR).',
  },
];

export const EDGE_RUNTIME_STATS = [
  { labelAr: 'استجابة لوحة التحكم', value: '~300 ms', detailAr: 'Laravel 12 + Blade + Caching (-40% استعلامات)' },
  { labelAr: 'استجابة نماذج التقييم', value: '~400 ms', detailAr: 'واجهات المريض اللمسية عبر الشبكة المحلية' },
  { labelAr: 'حساب الدرجات المعقدة', value: '< 1.0 s', detailAr: 'محرك التصحيح المزدوج (الموحدة + المخصصة)' },
  { labelAr: 'استهلاك الذاكرة بالذروة', value: '3.5 GB', detailAr: 'النظام + تطبيق الويب (400MB) + نماذج AI (2GB)' },
  { labelAr: 'استهلاك المعالج بالذروة', value: '25% - 35%', detailAr: 'يعمل بكفاءة على Raspberry Pi 5 / Pi 4' },
  { labelAr: 'معدل مزامنة المشاعر', value: '> 98%', detailAr: 'ربط لقطات المشاعر الفورية بأسئلة الجلسة' },
];
