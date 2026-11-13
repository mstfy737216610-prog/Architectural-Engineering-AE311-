export type SceneCategory = 'problem' | 'hardware' | 'ui' | 'compliance';

export type CharacterAnchor = 'clinic_doctor' | 'clinic_patient' | 'tech_standalone' | 'figma_ui';

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
  code: string;
  titleAr: string;
  titleEn: string;
  timeRange: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  recommendedVideoDuration: '5s' | '8s' | '10s';
  category: SceneCategory;
  categoryLabelAr: string;
  characterAnchor: CharacterAnchor;
  conceptAr: string;
  imagePrompt: string;
  motionPrompt: string;
  visualSource: 'generated_keyframe' | 'figma_ui';
  serverImagePath: string;
  voiceoverSegmentAr: string;
  keyMetricBadge?: string;
}

export interface SubtitleCue {
  id: number;
  timeRange: string;
  startSec: number;
  endSec: number;
  textEn: string;
  textArHint: string;
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

export const MASTER_STYLE_GUIDE: MasterStyleGuide = {
  clinicPrompt:
    '3D clean modern medical animation style, 16:9, Pixar-inspired smooth rendering, minimalist modern mental health clinic room with clean white walls, warm wood accents, and soft sage green indoor plants, cohesive sage green and white color palette, soft diffused natural studio lighting, high detail, 8k',
  doctorPrompt:
    'a 40-year-old Arab male clinical psychologist, consistent facial features, short black hair with slight gray at temples, neat trimmed beard, wearing thin black rectangular glasses, a crisp light blue button-down shirt under a tailored white medical coat',
  patientPrompt:
    'a 25-year-old Arab young woman, calm expression, wearing a modest soft beige hijab and a sage green casual blazer',
  clinicSummaryAr:
    'نمط رسوم طبية ثلاثي الأبعاد نظيف (Pixar-inspired)، عيادة صحة نفسية عصرية بجدران بيضاء، لمسات خشبية دافئة، نباتات خضراء هادئة، وإضاءة استوديو ناعمة.',
  doctorSummaryAr:
    'أخصائي نفسي عربي (40 عاماً)، شعر أسود قصير مع شيب خفيف عند الصدغين، لحية مهذبة، نظارة مستطيلة سوداء رفيعة، قميص أزرق فاتح تحت معطف طبي أبيض.',
  patientSummaryAr:
    'شابة عربية (25 عاماً)، ملامح هادئة، ترتدي حجاباً بيج ناعماً وسترة كاجوال باللون الأخضر المريمي (Sage Green).',
};

export const PROMO_SCENES: PromoScene[] = [
  {
    id: 1,
    code: 'SC-01',
    titleAr: 'المعاناة مع الأوراق المتراكمة',
    titleEn: 'Paperwork Overload',
    timeRange: '0:00 - 0:08',
    startSec: 0,
    endSec: 8,
    durationSec: 8,
    recommendedVideoDuration: '8s',
    category: 'problem',
    categoryLabelAr: 'تحديات العيادة',
    characterAnchor: 'clinic_doctor',
    conceptAr:
      'إظهار عيادة تعتمد على النماذج الورقية التقليدية (مثل استبيانات الاكتئاب والقلق القديمة) وما تسببه من إرهاق للأخصائي.',
    imagePrompt:
      'sitting at his clinic desk buried behind tall messy stacks of paper questionnaires, looking stressed and rubbing his forehead, medium shot',
    motionPrompt:
      'Slow camera push in, papers slightly shifting on the desk, the psychologist sighs and rubs his temples in exhaustion',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/scene_01_paperwork_1794609018351.jpg',
    voiceoverSegmentAr:
      'تعتمد العيادات النفسية حتى يومنا هذا على الاستبيانات الورقية التقليدية؛ مما يسبب ضغطاً كبيراً على الأخصائي،',
    keyMetricBadge: 'تقييم ورقي بطيء',
  },
  {
    id: 2,
    code: 'SC-02',
    titleAr: 'أخطاء التصحيح اليدوي وضياع الوقت',
    titleEn: 'Manual Scoring Errors',
    timeRange: '0:08 - 0:15',
    startSec: 8,
    endSec: 15,
    durationSec: 7,
    recommendedVideoDuration: '8s',
    category: 'problem',
    categoryLabelAr: 'تحديات العيادة',
    characterAnchor: 'clinic_doctor',
    conceptAr:
      'إبراز إهدار الوقت وأخطاء العمليات الحسابية اليدوية في تصحيح درجات الاستبيانات السيكومترية.',
    imagePrompt:
      'holding a red pen grading paper forms with red cross marks, a wall clock visible in the background, over-the-shoulder close-up shot',
    motionPrompt:
      "Subtle camera pan, the doctor's hand marks red X on the paper, clock hands spinning rapidly in the background",
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/scene_02_manual_scoring_1794609018744.jpg',
    voiceoverSegmentAr: 'وبطء التقييم، وأخطاء التصحيح اليدوي،',
    keyMetricBadge: 'أخطاء حسابية بشرية',
  },
  {
    id: 3,
    code: 'SC-03',
    titleAr: 'خطر تسريب البيانات الصحية عبر الإنترنت',
    titleEn: 'Cloud Cybersecurity Risk',
    timeRange: '0:15 - 0:22',
    startSec: 15,
    endSec: 22,
    durationSec: 7,
    recommendedVideoDuration: '8s',
    category: 'problem',
    categoryLabelAr: 'مخاطر الخصوصية',
    characterAnchor: 'tech_standalone',
    conceptAr:
      'توضيح مخاطر الأمن السيبراني عند رفع البيانات السيكومترية الحساسة ومقاطع الوجه إلى الخدمات السحابية.',
    imagePrompt:
      '3D clean modern tech animation style, 16:9, glowing digital patient medical files floating upward into a dark stormy digital cloud, a bright red warning shield and padlock breaking open, cybersecurity threat concept, sleek lighting',
    motionPrompt:
      'Files floating up into the cloud, red warning icon pulsing and flashing, dramatic camera zoom',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/scene_03_cloud_risk_1794609019758.jpg',
    voiceoverSegmentAr: 'فضلاً عن مخاطر تسريب بيانات المرضى الحساسة عند تخزينها عبر الإنترنت.',
    keyMetricBadge: 'مخاطر السحابة',
  },
  {
    id: 4,
    code: 'SC-04',
    titleAr: 'الحل الهندسي - جهاز Raspberry Pi 5',
    titleEn: 'Raspberry Pi 5 Edge Hardware',
    timeRange: '0:22 - 0:30',
    startSec: 22,
    endSec: 30,
    durationSec: 8,
    recommendedVideoDuration: '8s',
    category: 'hardware',
    categoryLabelAr: 'الحل الهندسي',
    characterAnchor: 'tech_standalone',
    conceptAr:
      'استعراض وحدة الحوسبة الطرفية المحلية (Raspberry Pi 5 مع وحدة الكاميرا V2 وشاشة اللمس).',
    imagePrompt:
      '3D clean modern product design render, 16:9, a sleek compact Raspberry Pi 5 medical device connected to a modern touchscreen tablet and a small mounted camera module on a clean white clinic desk, soft green accent lighting, futuristic medical hardware',
    motionPrompt:
      'Smooth 360 orbit camera movement around the device, subtle green LED light glowing on the hardware',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/scene_04_raspberry_pi_1794609020198.jpg',
    voiceoverSegmentAr:
      'من هنا جاء الابتكار. نقدم لكم نويسيس إيه آي (NoesisAI)؛ النظام الذكي المدمج على جهاز راسبيري باي 5 (Raspberry Pi 5)،',
    keyMetricBadge: 'Raspberry Pi 5',
  },
  {
    id: 5,
    code: 'SC-05',
    titleAr: 'العمل محلياً وبدون إنترنت',
    titleEn: '100% Offline Local Privacy',
    timeRange: '0:30 - 0:38',
    startSec: 30,
    endSec: 38,
    durationSec: 8,
    recommendedVideoDuration: '8s',
    category: 'hardware',
    categoryLabelAr: 'الأمان والخصوصية',
    characterAnchor: 'tech_standalone',
    conceptAr:
      'تأكيد عمل النظام بالكامل داخل الشبكة السريرية المحلية (Offline LAN) دون أي اتصال سحابي لحماية الخصوصية.',
    imagePrompt:
      '3D clean modern tech animation style, 16:9, a glowing emerald green protective dome covering the medical tablet device, disconnected Wi-Fi symbol outside the dome, glowing green digital lock and local AI brain icon inside, clean bright background',
    motionPrompt:
      'Green protective shield pulsing gently, digital lock snapping shut, smooth zoom in',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/scene_05_offline_privacy_1794609022007.jpg',
    voiceoverSegmentAr: 'والذي يعمل محلياً بالكامل دون أي اتصال بالإنترنت لضمان الخصوصية المطلقة.',
    keyMetricBadge: 'AES-256 · Offline LAN',
  },
  {
    id: 6,
    code: 'SC-06',
    titleAr: 'شاشة تسجيل الدخول (واجهة Figma)',
    titleEn: 'Noesis Login Portal',
    timeRange: '0:38 - 0:44',
    startSec: 38,
    endSec: 44,
    durationSec: 6,
    recommendedVideoDuration: '5s',
    category: 'ui',
    categoryLabelAr: 'واجهة النظام',
    characterAnchor: 'figma_ui',
    conceptAr:
      'عرض نقطة الدخول المركزية لنظام Noesis التي تضم مسار دخول الموظفين وبوابة المريض مع عبارة الطمأنينة والسرية.',
    imagePrompt:
      'Clean UI showcase of the Noesis Mental Health Wellness landing portal screen with green brain-leaf emblem, Quranic verse card, Employee Login button, and Patient Portal button',
    motionPrompt:
      'Smooth UI presentation, gentle camera zoom in toward the Noesis green logo and Employee Login button, subtle screen glow, clean professional tech motion',
    visualSource: 'figma_ui',
    serverImagePath: 'public/assets/aistudio/IMG-20261112-WA0000_14d93961.jpg',
    voiceoverSegmentAr: 'يتيح النظام للأخصائي تسجيل الدخول',
    keyMetricBadge: 'Figma UI · Portal',
  },
  {
    id: 7,
    code: 'SC-07',
    titleAr: 'المصادقة البيومترية للأخصائي بالتعرف على الوجه',
    titleEn: 'Biometric Clinician Face Verification',
    timeRange: '0:44 - 0:51',
    startSec: 44,
    endSec: 51,
    durationSec: 7,
    recommendedVideoDuration: '8s',
    category: 'hardware',
    categoryLabelAr: 'التحقق البيومتري',
    characterAnchor: 'clinic_doctor',
    conceptAr:
      'تأمين النظام عبر التحقق من وجه الأخصائي باستخدام نماذج VGG-Face (دقة 89.09%) و SFace (دقة 86.36%) بدقة إيجابية 99%.',
    imagePrompt:
      'smiling confidently while looking at a sleek modern computer monitor on his clean desk, a glowing emerald green biometric facial recognition scanning grid projected softly over his face, medium close-up shot',
    motionPrompt:
      "Smooth emerald green scan line sweeps across the doctor's face, a green checkmark icon appears on the screen, gentle camera zoom in",
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/scene_07_face_auth_1794609022085.jpg',
    voiceoverSegmentAr: 'بأمان تام عبر التعرف على الوجه،',
    keyMetricBadge: 'VGG-Face 89.09% · TNR 0.99',
  },
  {
    id: 8,
    code: 'SC-08',
    titleAr: 'اختيار المريض والاختبارات المعيارية (واجهة Figma)',
    titleEn: 'Patient Dashboard & Standardized Scales',
    timeRange: '0:51 - 0:59',
    startSec: 51,
    endSec: 59,
    durationSec: 8,
    recommendedVideoDuration: '8s',
    category: 'ui',
    categoryLabelAr: 'واجهة النظام',
    characterAnchor: 'figma_ui',
    conceptAr:
      'عرض المقاييس العالمية المدعومة في النظام مثل Y-BOCS للوسواس القهري، BDI للاكتئاب، TMAS للقلق، و ADHD.',
    imagePrompt:
      'Clean UI showcase of the Noesis Dashboard patient profile for Ameerah Alzaidi showing Assessments tab, Choose Assessment green button, and Y-BOCS history',
    motionPrompt:
      'Smooth screen recording style camera pan across the patient dashboard, subtle highlight movement on the Choose Assessment green button, crisp UI motion',
    visualSource: 'figma_ui',
    serverImagePath: 'public/assets/aistudio/IMG-20261112-WA0003_17083033.jpg',
    voiceoverSegmentAr:
      'وإدارة المقاييس النفسية المعتمدة عالمياً مثل Y-BOCS و BDI و TMAS بكل سهولة.',
    keyMetricBadge: 'Y-BOCS · BDI · TMAS · ADHD',
  },
  {
    id: 9,
    code: 'SC-09',
    titleAr: 'المريضة تجيب على شاشة اللمس الموجهة',
    titleEn: 'Patient Touchscreen Session',
    timeRange: '0:59 - 1:07',
    startSec: 59,
    endSec: 67,
    durationSec: 8,
    recommendedVideoDuration: '8s',
    category: 'hardware',
    categoryLabelAr: 'بوابة المريض',
    characterAnchor: 'clinic_patient',
    conceptAr:
      'تجربة المريضة في الإجابة عن الأسئلة بسلاسة على شاشة اللمس الموجهة بالتزامن مع التقاط الكاميرا لتعابير الوجه.',
    imagePrompt:
      'sitting comfortably in a clinic chair tapping answers on a sleek mounted touchscreen tablet connected to a compact Raspberry Pi 5 device with a small top camera module, side-angle medium shot',
    motionPrompt:
      'The young woman gently taps the touchscreen with her finger, subtle green indicator light glows on the camera module above the screen, smooth camera dolly movement',
    visualSource: 'generated_keyframe',
    serverImagePath: 'src/assets/images/scene_09_patient_touch_1794609021869.jpg',
    voiceoverSegmentAr: 'وأثناء إجابة المريض على شاشة اللمس،',
    keyMetricBadge: 'WCAG 2.1 AA · Touch UI',
  },
  {
    id: 10,
    code: 'SC-10',
    titleAr: 'تحليل تعابير الوجه لحظياً بالذكاء الاصطناعي (واجهة Figma)',
    titleEn: 'Real-time ViT Facial Emotion Analysis',
    timeRange: '1:07 - 1:15',
    startSec: 67,
    endSec: 75,
    durationSec: 8,
    recommendedVideoDuration: '8s',
    category: 'ui',
    categoryLabelAr: 'الذكاء الاصطناعي',
    characterAnchor: 'figma_ui',
    conceptAr:
      'تشغيل نموذج تحليل المشاعر (FER) القائم على Vision Transformer (ViT) بدقة 91.66% وزمن استدلال 8.37 مللي ثانية.',
    imagePrompt:
      'Clean UI showcase of the Real-time Biometric Face Analysis modal showing 7 facial emotion categories with thermal emotion heatmaps and green face tracking bounding boxes',
    motionPrompt:
      'Dynamic UI zoom in on the Real-time Biometric Face Analysis window, subtle pulsing on the green face tracking boxes and thermal emotion maps, high-tech medical analysis motion',
    visualSource: 'figma_ui',
    serverImagePath: 'public/assets/aistudio/IMG-20261112-WA0004_59c48489.jpg',
    voiceoverSegmentAr:
      'يقوم نموذج Vision Transformer المحلي بتحليل تعابير الوجه العاطفية في الوقت الفعلي بدقة تتجاوز 91.6% وبسرعة فائقة.',
    keyMetricBadge: 'ViT 91.66% · 8.37ms',
  },
  {
    id: 11,
    code: 'SC-11',
    titleAr: 'التقرير النهائي والمصحح آلياً (واجهة Figma)',
    titleEn: 'Automated Clinical Scoring Report',
    timeRange: '1:15 - 1:23',
    startSec: 75,
    endSec: 83,
    durationSec: 8,
    recommendedVideoDuration: '8s',
    category: 'ui',
    categoryLabelAr: 'التقارير الآلية',
    characterAnchor: 'figma_ui',
    conceptAr:
      'إظهار سرعة حساب النتائج في أقل من ثانية واحدة وعرض التقرير الشامل للدرجات السيكومترية والمؤشرات العاطفية.',
    imagePrompt:
      'Clean UI showcase of the Noesis automated Y-BOCS Assessment Score dashboard showing Obsessions Subtotal 8, Compulsions Subtotal 5, Total Score 13 Mild OCD, and Biometric Face Analysis summary',
    motionPrompt:
      'Smooth vertical camera tilt revealing the Y-BOCS Assessment Score and automated results on the Noesis dashboard, clean crisp UI animation',
    visualSource: 'figma_ui',
    serverImagePath: 'public/assets/aistudio/IMG-20261112-WA0002_d15921ed.jpg',
    voiceoverSegmentAr:
      'وفي أقل من ثانية، يقوم النظام بحساب الدرجات آلياً وإنشاء تقرير طبي شامل يجمع النتائج النفسية والمؤشرات السلوكية.',
    keyMetricBadge: 'حساب النتائج < 1 ثانية',
  },
  {
    id: 12,
    code: 'SC-12',
    titleAr: 'الخاتمة والمعايير الطبية والهندسية (واجهة Figma)',
    titleEn: 'Standards & Secure Conclusion',
    timeRange: '1:23 - 1:30',
    startSec: 83,
    endSec: 90,
    durationSec: 7,
    recommendedVideoDuration: '8s',
    category: 'compliance',
    categoryLabelAr: 'المعايير الطبية',
    characterAnchor: 'figma_ui',
    conceptAr:
      'إبراز التزام المشروع بالمعايير العالمية: IEC 62304 (برمجيات الأجهزة الطبية)، ISO 14971 (إدارة المخاطر)، و ISO 27001 (أمن المعلومات).',
    imagePrompt:
      'Clean UI showcase of the Noesis Assessment Complete confirmation screen featuring a vibrant green checkmark icon, Thank you message, Quran 13:28 reassurance card, and Finish button',
    motionPrompt:
      'Gentle zoom out from the Assessment Complete green checkmark screen, soft radiant light glow, calm and reassuring medical conclusion',
    visualSource: 'figma_ui',
    serverImagePath: 'public/assets/aistudio/IMG-20261112-WA0001_375c7977.jpg',
    voiceoverSegmentAr:
      'لقد صُمم NoesisAI وفق معايير برمجيات الأجهزة الطبية العالمية مثل IEC 62304 و ISO 27001، ليقدم تجربة ذكية وآمنة. NoesisAI… الذكاء الاصطناعي الآمن لخدمة الصحة النفسية.',
    keyMetricBadge: 'IEC 62304 · ISO 27001 · ISO 14971',
  },
];

export const FULL_VOICEOVER_SCRIPT_AR = `تعتمد العيادات النفسية حتى يومنا هذا على الاستبيانات الورقية التقليدية؛ مما يسبب ضغطاً كبيراً على الأخصائي، وبطء التقييم، وأخطاء التصحيح اليدوي، فضلاً عن مخاطر تسريب بيانات المرضى الحساسة عند تخزينها عبر الإنترنت.
من هنا جاء الابتكار. نقدم لكم نويسيس إيه آي (NoesisAI)؛ النظام الذكي المدمج على جهاز راسبيري باي 5 (Raspberry Pi 5)، والذي يعمل محلياً بالكامل دون أي اتصال بالإنترنت لضمان الخصوصية المطلقة.
يتيح النظام للأخصائي تسجيل الدخول بأمان تام عبر التعرف على الوجه، وإدارة المقاييس النفسية المعتمدة عالمياً مثل Y-BOCS و BDI و TMAS بكل سهولة.
وأثناء إجابة المريض على شاشة اللمس، يقوم نموذج Vision Transformer المحلي بتحليل تعابير الوجه العاطفية في الوقت الفعلي بدقة تتجاوز 91.6% وبسرعة فائقة.
وفي أقل من ثانية، يقوم النظام بحساب الدرجات آلياً وإنشاء تقرير طبي شامل يجمع النتائج النفسية والمؤشرات السلوكية.
لقد صُمم NoesisAI وفق معايير برمجيات الأجهزة الطبية العالمية مثل IEC 62304 و ISO 27001، ليقدم تجربة ذكية وآمنة.
NoesisAI… الذكاء الاصطناعي الآمن لخدمة الصحة النفسية.`;

export const CAPCUT_SUBTITLES: SubtitleCue[] = [
  {
    id: 1,
    timeRange: '0:00 - 0:20',
    startSec: 0,
    endSec: 20,
    textEn:
      'Psychological clinics still rely on traditional paper assessments, causing heavy clinician workload, slow evaluations, manual scoring errors, and severe privacy risks when storing sensitive patient data online.',
    textArHint: 'المشكلة: الاعتماد على الأوراق، أخطاء التصحيح اليدوي، ومخاطر تسريب البيانات عبر السحابة.',
  },
  {
    id: 2,
    timeRange: '0:20 - 0:35',
    startSec: 20,
    endSec: 35,
    textEn:
      'Introducing NoesisAI: a fully integrated smart system powered by Raspberry Pi 5, operating completely offline locally to ensure absolute data privacy.',
    textArHint: 'الحل: نظام NoesisAI المدمج على Raspberry Pi 5 للعمل محلياً دون إنترنت.',
  },
  {
    id: 3,
    timeRange: '0:35 - 1:10',
    startSec: 35,
    endSec: 70,
    textEn:
      'The clinician logs in securely via Face ID, managing standardized scales like Y-BOCS and BDI. While the patient responds on the touchscreen, the local Vision Transformer AI analyzes facial expressions in real-time with over 91.6% accuracy. Within a second, the system auto-scores and generates a comprehensive clinical report.',
    textArHint: 'سير العمل: دخول بيومتري، إدارة المقاييس، تحليل تعابير الوجه ViT بدقة 91.66%، والتصحيح الآلي.',
  },
  {
    id: 4,
    timeRange: '1:10 - 1:30',
    startSec: 70,
    endSec: 90,
    textEn:
      'Built under strict international medical device standards including IEC 62304 and ISO 27001, NoesisAI delivers a smart and secure solution for mental health. NoesisAI… Secure AI for Mental Health.',
    textArHint: 'الخاتمة: الالتزام بمعايير IEC 62304 و ISO 27001 للأجهزة الطبية.',
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
    notesAr: 'النموذج المعتمد في NoesisAI — حقق أعلى دقة على FER-2013 بزمن استدلال أقل من 9 مللي ثانية.',
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
    notesAr: 'النموذج المعتمد لمصادقة الأخصائي عندما تكون الأولوية لرفع معدل القبول الصحيح مع TNR = 0.99.',
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
