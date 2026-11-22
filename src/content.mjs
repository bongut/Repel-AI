export const sources = {
  google: ['Google · Machine Learning Crash Course', 'https://developers.google.com/machine-learning/crash-course/classification/thresholding', 'Thresholds, false positives, and false negatives'],
  nist: ['NIST · AI Risk Management Framework', 'https://www.nist.gov/itl/ai-risk-management-framework', 'Validity, fairness, privacy, and accountability'],
  unesco: ['UNESCO · Guidance for generative AI in education and research', 'https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research', 'Human agency, privacy, and educational use'],
  tsa: ['National TSA · Themes and Problems', 'https://tsaweb.org/competitions/themes-and-problems?authuser=0&hspage=4&mspage=1', 'The 2026–27 high school Webmaster theme'],
  updates: ['National TSA · Competition Updates', 'https://tsaweb.org/competitions/competition-updates', 'Corrections and announcements'],
  texas: ['Texas TSA · State Rulebook', 'https://texastsa.org/texas-tsa-rule-book/', 'Texas competition rules and forms'],
  texasAI: ['Texas TSA · Copyright, Original Work, and Generative AI Policy', 'https://texastsa.org/wp-content/uploads/2026/10/Copyright-AI-and-Uniqueness-of-Student-Work.pdf', 'Student authorship, citations, and limits on generative AI']
};

export const modules = [
  {
    id: 'foundations', number: '01', title: 'Foundations', tagline: 'How machines learn.',
    intro: 'Follow a prediction from training data to a decision. Then test what happens when you move a decision boundary.',
    objectives: ['Distinguish AI, machine learning, and generative AI.', 'Explain the difference between training and inference.', 'Interpret prediction errors and check uncertain outputs.'],
    sources: ['google', 'nist'], badge: 'Pattern Finder',
    lessons: [
      ['AI, machine learning, and generation',
        'Artificial intelligence is a broad term for systems that perform tasks such as recognizing speech, making predictions, or planning a route. Some AI systems use rules written by people. Machine learning systems use examples or other data to adjust how they perform a task.',
        'Generative AI produces material such as text, images, or audio. Most current generative AI uses machine learning. A spam filter that labels messages is also machine learning, but its job is classification. A calculator following fixed arithmetic steps illustrates ordinary automation.',
        'Compare a tool that labels a photo “bird” with one that draws a bird. What does each produce?'],
      ['Training and inference',
        'During training, a model adjusts internal parameters using data and a learning objective. A model learning to identify leaves might compare its predictions with labels and update its parameters repeatedly to reduce errors.',
        'During inference, the trained model uses those learned parameters to process an input, such as a photo it has never seen. Teams keep some examples out of training so they can test how well a model handles unfamiliar inputs.',
        'A school sorts recycling from photos taken in bright light. What should it test before using the system in a dim cafeteria?'],
      ['Why confidence can mislead',
        'An AI system can make errors when its training examples miss important cases, its input is ambiguous, or conditions change. A threshold changes which cases receive a positive label. Raising it can reduce false positives while missing more real positives.',
        'A language model generates likely continuations based on learned patterns. It can produce a fluent explanation with a false date or an invented citation. Check consequential claims against independent evidence, and record uncertainty when evidence is missing.',
        'An answer gives the exact date of a historical event without a source. Where would you look to verify it?']
    ],
    quiz: [
      ['Which task is generative?', ['Label an email as spam', 'Create a new illustration from a description', 'Sort numbers in ascending order'], 1, 'The system makes new content. Spam labeling is classification, and sorting can follow a fixed algorithm.'],
      ['What changes during model training?', ['The user’s current question', 'The model’s learned parameters', 'The class names every time'], 1, 'Training adjusts learned parameters according to data and a learning objective.'],
      ['A trained model labels a new leaf. Which stage is this?', ['Inference', 'Training', 'Data labeling'], 0, 'Inference applies learned parameters to an input. The model can predict without updating its parameters.'],
      ['Raising a positive threshold can produce which trade-off?', ['Fewer false positives and more missed positives', 'Perfect predictions', 'More predicted positives at every score'], 0, 'A stricter cut admits fewer scores. It can remove false alarms while excluding actual positives.'],
      ['A fluent answer names a surprising study. What should you do first?', ['Trust its confident tone', 'Ask it to sound more certain', 'Locate the study and check what it says'], 2, 'A source can be checked independently. Confidence and fluency do not establish accuracy.']
    ]
  },
  {
    id: 'practice', number: '02', title: 'Practice', tagline: 'Ask better questions.',
    intro: 'Break messy assignments into workable steps, write clear prompts, and check the results yourself.',
    objectives: ['Break a task into steps with clear checkpoints.', 'Describe a task, context, constraints, and format.', 'Verify claims and follow classroom rules on what you can share.'],
    sources: ['unesco', 'nist'], badge: 'Prompt Builder',
    lessons: [
      ['Give the tool one job at a time',
        'Start with an outcome you can check. If you are making a study guide, identify the material the guide should cover, outline the sections, then draft questions. Check an outline against your notes before generating a full guide.',
        'Decide which steps you should do yourself. If an assignment measures your interpretation of a poem, for example, do that interpretation. If your teacher allows it, you might ask a tool for questions that help you examine your own reading.',
        'Plan two checkpoints for writing a study guide from approved class notes.'],
      ['Write a prompt you can evaluate',
        'Name the task, provide the context it needs, and describe the boundaries. “Write four practice problems for a class that knows linear equations but has not started quadratics” is easier to evaluate than “Make me a math worksheet.”',
        'Choose an output format suited to your next step. You might request a numbered list, a table with named columns, or a draft with uncertain claims marked. Test the result against those instructions and revise one part of the prompt at a time.',
        'Add a useful constraint to a prompt that asks for practice questions about ecosystems.'],
      ['Verify before you reuse',
        'Identify the claims that matter most. Find the original source for each one, check its date and author, then read the relevant passage to see whether it supports the claim. Verify calculations independently and check examples against your course materials.',
        'Follow the assignment’s AI policy. Remove names, grades, addresses, and other private details from anything you plan to share. Ask your teacher before submitting classmates’ work or using an unfamiliar tool, and disclose permitted assistance as required.',
        'A generated paragraph cites a report you cannot find. Decide how you would revise the paragraph before turning it in.']
    ],
    quiz: [
      ['What is a good first step for making a study guide?', ['Generate a final guide before reviewing the topic', 'List the topics and agree on a checkable goal', 'Ask a tool to choose your grade'], 1, 'A checkable goal lets you plan the task and evaluate later drafts.'],
      ['Which detail gives useful context for a math prompt?', ['“Explain it better”', 'An unrelated class schedule', '“We know linear equations and are starting slope”'], 2, 'The last detail identifies the relevant knowledge and the next learning goal.'],
      ['Which instruction describes an output format?', ['“Return a table with Topic and Example columns”', '“Use these approved notes”', '“Avoid quadratic equations”'], 0, 'The named columns describe the shape of the output. The other options supply context and a scope constraint.'],
      ['You find a cited report. What do you verify next?', ['Whether the report really supports the claim', 'Whether the answer sounds formal', 'Whether a second chatbot repeats it'], 0, 'A real report can still be cited in support of a claim it never makes. Open and read the relevant passage.'],
      ['Your prompt includes a classmate’s grades. What is the best next step?', ['Share it if their name is shortened', 'Remove identifying and private data and follow school policy', 'Hide the data in an attachment'], 1, 'Grades are private. Even initials or details in an attachment may identify a person.']
    ]
  },
  {
    id: 'ethics', number: '03', title: 'Ethics', tagline: 'Think beyond the output.',
    intro: 'Trace the consequences of an AI decision, consider whose interests are at stake, and decide where people should step in.',
    objectives: ['Identify how uneven representation can affect outcomes.', 'Make privacy and consent decisions in school scenarios.', 'Explain disclosure, human oversight, and accountability.'],
    sources: ['nist', 'unesco'], badge: 'Responsible Designer',
    lessons: [
      ['Who is represented?',
        'A model can perform better for people or situations that appear often in its training data. A speech system tested mostly on one accent and in quiet rooms could make more errors on other accents or in noisy classrooms.',
        'Check performance across relevant groups and conditions. A high average can hide a serious gap. Ask who benefits, who bears the cost of errors, and who had a say in choosing the labels or deciding whether to use the model.',
        'How would you test a school captioning tool so a high average score cannot hide an important failure?'],
      ['Privacy, consent, and disclosure',
        'Think about whether you have permission to share the information, what the tool needs to do the job, and how the service might retain or reuse the input. Use invented examples or approved public material when real people’s details are unnecessary.',
        'Read the specific assignment rules. Permission to brainstorm may differ from permission to generate a draft. When disclosure is required, state what the tool helped with and describe what you verified or revised yourself.',
        'Draft a one-sentence disclosure for an assignment where your teacher allowed AI to suggest interview questions.'],
      ['Keep people responsible',
        'A person or organization remains responsible for decisions made with AI. Useful oversight means reviewers have context, time, and the authority to change an outcome. When a decision affects someone’s opportunities, plan for corrections and appeals.',
        'Before using a tool, consider the severity of a mistake and whether people can catch it. A tool that helps organize an optional event has different consequences from a tool that ranks applicants for a limited opportunity.',
        'What information would a reviewer need before accepting an AI-generated recommendation about student club applications?']
    ],
    quiz: [
      ['Why test a captioning model across different accents?', ['An average can hide unequal error rates', 'Every accent produces the same errors', 'Tests guarantee consent'], 0, 'The overall rate can look strong even if a particular group sees many more errors.'],
      ['Which input is most appropriate for testing a school scenario?', ['Private student records', 'A fictional case with no real people’s details', 'Class chat messages copied without permission'], 1, 'A fictional case can convey the relevant situation while minimizing exposure of private information.'],
      ['Who sets the rules for AI assistance on your assignment?', ['The chatbot', 'Students on social media', 'Your teacher and institution'], 2, 'Assignment and institution policies establish what is allowed and how assistance must be disclosed.'],
      ['What makes oversight meaningful?', ['A reviewer can inspect and change the result', 'A reviewer must always accept the output', 'The system has a person’s name'], 0, 'Oversight requires enough information and authority to correct an outcome.'],
      ['Which is a useful disclosure when assistance was permitted?', ['“The computer did things”', '“I used AI to brainstorm headings, then wrote and checked the essay myself”', '“AI was used somewhere”'], 1, 'Specific disclosure makes the tool’s role and the student’s own contribution clear.']
    ]
  }
];

export const scenarios = [
  {
    title: 'A voice the tool misses',
    case: 'The school’s automatic captions work well in tests, but a student reports frequent mistakes when classmates with their accent speak.',
    choices: [
      ['Roll it out based on the average score', 'A strong average might hide a pattern of errors. Talk with affected students and test the conditions where they report problems before relying on the tool.'],
      ['Test with a wider group and offer reviewed captions', 'This checks for uneven performance and gives students a usable alternative. Invite volunteers with informed consent and avoid retaining recordings you do not need.'],
      ['Turn it off immediately', 'Pausing can make sense if bad captions cause harm and better support is available. Consider accessibility needs while you investigate.']
    ]
  },
  {
    title: 'Feedback on a classmate’s draft',
    case: 'Your peer-review partner shares a personal essay. You want to paste it into an AI tool to brainstorm feedback.',
    choices: [
      ['Upload it after removing the name', 'The story itself may still identify the writer. Removing the name alone also does not resolve permission or school policy.'],
      ['Review it yourself and ask for generic feedback questions', 'Generic questions can help you structure the review without sharing the essay. Check whether the assignment permits using AI even for that narrower task.'],
      ['Ask your partner before sharing the draft', 'Consent matters, and the writer should know where the text would go. You still need to check the school’s rules and whether uploading is necessary.']
    ]
  }
];

export const samples = [
  { score: 14, actual: false }, { score: 23, actual: false },
  { score: 35, actual: false }, { score: 43, actual: true },
  { score: 49, actual: false }, { score: 59, actual: true },
  { score: 64, actual: false }, { score: 73, actual: true },
  { score: 82, actual: true }, { score: 92, actual: true }
];
