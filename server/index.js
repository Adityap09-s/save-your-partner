import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DB = path.join(DATA_DIR, 'db.json');
const ADMIN_KEY = process.env.ADMIN_KEY || 'Aditya12';

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const defaultQuestions = [
  [
    ['debug', 'Fix the missing symbol in this C code.', 'int a = 10\nprintf("%d", a);', ';', 'Add the missing semicolon after the first line.'],
    ['code', 'Write a C program statement that stores 10 in variable a.', '', 'int a = 10;', 'Use a simple integer variable declaration.'],
    ['debug', 'Fix the missing semicolon.', 'int marks = 50\nprintf("%d", marks);', ';', 'The declaration needs a semicolon.'],
    ['code', 'Write one C statement to print the value 10.', '', 'printf("%d", 10);', 'Use printf with the integer 10.'],
    ['debug', 'Fix the missing semicolon.', 'int x = 5\nint y = 3;', ';', 'The first declaration needs a semicolon.'],
    ['code', 'Write a C statement to store 20 in variable age.', '', 'int age = 20;', 'Declare an integer named age.'],
    ['debug', 'Fix the missing semicolon.', 'int total = 15\nreturn 0;', ';', 'The variable declaration needs a semicolon.'],
    ['code', 'Write a C statement that adds a and b and stores the result in sum.', '', 'int sum = a + b;', 'Use the + operator.'],
    ['debug', 'Fix the missing semicolon.', 'int number = 7\nprintf("%d", number);', ';', 'The declaration needs a semicolon.'],
    ['code', 'Write a C statement that stores 5 + 3 in result.', '', 'int result = 5 + 3;', 'Use an integer declaration and + operator.'],
    ['debug', 'Fix the missing semicolon.', 'int a = 2\nint b = 4;', ';', 'The first line needs a semicolon.'],
    ['code', 'Write a C statement that prints the value of variable x.', '', 'printf("%d", x);', 'Use printf with %d.'],
    ['debug', 'Fix the missing semicolon.', 'int score = 90\nprintf("%d", score);', ';', 'The declaration needs a semicolon.'],
    ['code', 'Write a C statement to store 100 in variable marks.', '', 'int marks = 100;', 'Use an integer variable.'],
    ['debug', 'Fix the missing semicolon.', 'int n = 8\nprintf("%d", n);', ';', 'Add a semicolon after the declaration.'],
    ['code', 'Write a C statement that subtracts b from a and stores it in d.', '', 'int d = a - b;', 'Use the - operator.'],
    ['debug', 'Fix the missing semicolon.', 'int price = 50\nint qty = 2;', ';', 'The first declaration needs a semicolon.'],
    ['code', 'Write a C statement to multiply x by 2 and store it in y.', '', 'int y = x * 2;', 'Use the * operator.'],
    ['debug', 'Fix the missing semicolon.', 'int value = 25\nprintf("%d", value);', ';', 'The declaration needs a semicolon.'],
    ['code', 'Write a C statement that divides a by 2 and stores it in half.', '', 'int half = a / 2;', 'Use the / operator.']
  ],
  [
    ['debug', 'Fix the missing semicolon.', 'int x = 10\nint y = 20;', ';', 'Add the missing semicolon.'],
    ['code', 'Write a C statement to find the sum of 4 and 6.', '', 'int sum = 4 + 6;', 'Use +.'],
    ['debug', 'Fix the missing bracket.', 'int main() {\n  printf("Hello");\n', '}', 'Close main with }.'],
    ['code', 'Write a C statement that prints Hello.', '', 'printf("Hello");', 'Use printf.'],
    ['debug', 'Fix the missing semicolon.', 'int a = 4\nint b = 5;', ';', 'The first declaration needs ;.'],
    ['code', 'Write a C condition that checks whether x is greater than 5.', '', 'if (x > 5)', 'Use >.'],
    ['debug', 'Fix the missing closing parenthesis.', 'if (x > 5 {\n  printf("Yes");\n}', ')', 'Close the if condition with ).'],
    ['code', 'Write a C statement to store 7 multiplied by 2 in result.', '', 'int result = 7 * 2;', 'Use *.'],
    ['debug', 'Fix the missing semicolon.', 'int a = 3\nprintf("%d", a);', ';', 'Add ; after the declaration.'],
    ['code', 'Write a C statement to store 9 divided by 3 in result.', '', 'int result = 9 / 3;', 'Use /.'],
    ['debug', 'Fix the missing closing brace.', 'if (x > 0) {\n  printf("Positive");', '}', 'Close the if block.'],
    ['code', 'Write a C condition that checks whether n equals 10.', '', 'if (n == 10)', 'Use == for comparison.'],
    ['debug', 'Fix the comparison operator.', 'if (x = 5) {\n  printf("Five");\n}', '==', 'Use == for comparison.'],
    ['code', 'Write a C statement that stores x + 1 in y.', '', 'int y = x + 1;', 'Use +.'],
    ['debug', 'Fix the missing semicolon.', 'int total = a + b\nprintf("%d", total);', ';', 'Add ; after the expression.'],
    ['code', 'Write a C statement to print the value of marks.', '', 'printf("%d", marks);', 'Use %d.'],
    ['debug', 'Fix the missing closing parenthesis.', 'printf("Hello";', ')', 'printf needs a closing parenthesis.'],
    ['code', 'Write a C statement to store 25 in n.', '', 'int n = 25;', 'Use an integer declaration.'],
    ['debug', 'Fix the missing semicolon.', 'int count = 1\ncount = count + 1;', ';', 'The declaration needs ;.'],
    ['code', 'Write a C statement that stores a - b in result.', '', 'int result = a - b;', 'Use -.']
  ],
  [
    ['debug', 'Fix the missing semicolon.', 'int x = 1\nint y = 2\nint z = x + y;', ';', 'The first line is missing ;.'],
    ['code', 'Write a C if statement that prints Yes when x is 10.', '', 'if (x == 10) printf("Yes");', 'Use ==.'],
    ['debug', 'Fix the missing comparison operator.', 'if (age = 18) {\n  printf("Adult");\n}', '==', 'Use == to compare.'],
    ['code', 'Write a C for loop that runs from 0 to 4.', '', 'for (int i = 0; i < 5; i++)', 'Use a basic for loop.'],
    ['debug', 'Fix the missing semicolon.', 'int i = 0\nwhile (i < 3) {\n  i++;\n}', ';', 'The initialization needs ;.'],
    ['code', 'Write a C statement that increments i by 1.', '', 'i++;', 'Use the increment operator.'],
    ['debug', 'Fix the missing brace.', 'for (int i = 0; i < 3; i++) {\n  printf("%d", i);', '}', 'Close the loop block.'],
    ['code', 'Write a C while condition that continues while n is less than 5.', '', 'while (n < 5)', 'Use <.'],
    ['debug', 'Fix the missing semicolon.', 'int n = 5\nif (n > 3) {\n  printf("OK");\n}', ';', 'The declaration needs ;.'],
    ['code', 'Write a C statement to decrement x by 1.', '', 'x--;', 'Use --.'],
    ['debug', 'Fix the missing parenthesis.', 'for (int i = 0; i < 5; i++ {\n  printf("%d", i);\n}', ')', 'Close the for condition.'],
    ['code', 'Write a C condition checking whether n is less than or equal to 10.', '', 'if (n <= 10)', 'Use <=.'],
    ['debug', 'Fix the missing semicolon.', 'int sum = 0\nsum = sum + 1;', ';', 'The declaration needs ;.'],
    ['code', 'Write a C statement that stores x multiplied by 10 in y.', '', 'int y = x * 10;', 'Use *.'],
    ['debug', 'Fix the assignment statement.', 'int x = 5\nx x + 1;', '=', 'Write x = x + 1;.'],
    ['code', 'Write a C condition checking whether a is not equal to b.', '', 'if (a != b)', 'Use !=.'],
    ['debug', 'Fix the missing semicolon.', 'int result = 10 / 2\nprintf("%d", result);', ';', 'The declaration needs ;.'],
    ['code', 'Write a C statement to store 2 raised conceptually as 2*2 in square.', '', 'int square = 2 * 2;', 'Use multiplication.'],
    ['debug', 'Fix the missing brace.', 'if (x == 0) {\n  printf("Zero");\n', '}', 'Close the if block.'],
    ['code', 'Write a C statement that stores x + y + z in total.', '', 'int total = x + y + z;', 'Use +.']
  ],
  [
    ['debug', 'Fix the missing semicolon.', 'int marks = 80\nif (marks >= 40) {\n  printf("Pass");\n}', ';', 'The declaration needs ;.'],
    ['code', 'Write a C if-else statement that prints Pass when marks >= 40.', '', 'if (marks >= 40) { printf("Pass"); } else { printf("Fail"); }', 'Use if and else.'],
    ['debug', 'Fix the comparison.', 'if (marks > 40) {\n  printf("Pass");\n}', '>=', 'The condition should include 40.'],
    ['code', 'Write a simple C function header named add that takes two integers.', '', 'int add(int a, int b)', 'Use two integer parameters.'],
    ['debug', 'Fix the missing return.', 'int add(int a, int b) {\n  int c = a + b;\n}', 'return c;', 'Return c from the function.'],
    ['code', 'Write the return statement for a function returning variable result.', '', 'return result;', 'Use return.'],
    ['debug', 'Fix the missing semicolon.', 'int result = add(2, 3)\nprintf("%d", result);', ';', 'The function call needs ;.'],
    ['code', 'Write a C function call to add 2 and 3 and store it in result.', '', 'int result = add(2, 3);', 'Call add with two values.'],
    ['debug', 'Fix the missing brace.', 'int add(int a, int b) {\n  return a + b;', '}', 'Close the function.'],
    ['code', 'Write a C condition that checks x is between 1 and 10 inclusive.', '', 'if (x >= 1 && x <= 10)', 'Use &&.'],
    ['debug', 'Fix the logical operator.', 'if (x > 0 & x < 10) {\n  printf("OK");\n}', '&&', 'Use logical AND.'],
    ['code', 'Write a C statement that stores the remainder of a divided by b.', '', 'int r = a % b;', 'Use %.'],
    ['debug', 'Fix the operator.', 'int r = a /% b;', '%', 'Use the remainder operator correctly.'],
    ['code', 'Write a C loop that prints 1, 2, and 3 using i.', '', 'for (int i = 1; i <= 3; i++) printf("%d", i);', 'Use a basic loop.'],
    ['debug', 'Fix the missing semicolon.', 'int i = 1\nfor (; i <= 3; i++) {\n  printf("%d", i);\n}', ';', 'Initialization needs ;.'],
    ['code', 'Write a C condition that checks whether x is even.', '', 'if (x % 2 == 0)', 'Use %.'],
    ['debug', 'Fix the missing comparison.', 'if (x % 2 = 0) {\n  printf("Even");\n}', '==', 'Use == for comparison.'],
    ['code', 'Write a C statement that stores the larger of a and b using a simple if.', '', 'if (a > b) max = a;', 'Use >.'],
    ['debug', 'Fix the missing semicolon.', 'max = a\nmin = b;', ';', 'The first assignment needs ;.'],
    ['code', 'Write a C statement to initialize count to zero.', '', 'int count = 0;', 'Use an integer variable.']
  ],
  [
    ['debug', 'Fix the missing semicolon.', 'int n = 10\nif (n % 2 == 0) {\n  printf("Even");\n}', ';', 'The declaration needs ;.'],
    ['code', 'Write a C function named square that returns x*x.', '', 'int square(int x) { return x * x; }', 'Use a simple function.'],
    ['debug', 'Fix the return statement.', 'int square(int x) {\n  return x x;\n}', '*', 'Multiply x by x.'],
    ['code', 'Write a C loop to print numbers 1 to 5.', '', 'for (int i = 1; i <= 5; i++) printf("%d", i);', 'Use a for loop.'],
    ['debug', 'Fix the loop condition.', 'for (int i = 1; i < 5; i++) {\n  printf("%d", i);\n}', '<=', 'The loop must include 5.'],
    ['code', 'Write a C condition to check if n is positive.', '', 'if (n > 0)', 'Use >.'],
    ['debug', 'Fix the missing semicolon.', 'int positive = 1\nprintf("%d", positive);', ';', 'The declaration needs ;.'],
    ['code', 'Write a C statement that assigns 0 to total.', '', 'total = 0;', 'Use assignment.'],
    ['debug', 'Fix the assignment operator.', 'total == 0;', '=', 'Use = for assignment.'],
    ['code', 'Write a C statement that adds 5 to total.', '', 'total = total + 5;', 'Use +.'],
    ['debug', 'Fix the missing semicolon.', 'total = total + 5\nprintf("%d", total);', ';', 'Add ; after assignment.'],
    ['code', 'Write a C condition for x being exactly zero.', '', 'if (x == 0)', 'Use ==.'],
    ['debug', 'Fix the missing brace.', 'if (x == 0) {\n  printf("Zero");', '}', 'Close the block.'],
    ['code', 'Write a C statement that stores the average of a and b using integer division.', '', 'int avg = (a + b) / 2;', 'Use parentheses.'],
    ['debug', 'Fix the missing parenthesis.', 'int avg = a + b) / 2;', '(', 'Add the opening parenthesis.'],
    ['code', 'Write a C statement to call function show().', '', 'show();', 'Add parentheses and semicolon.'],
    ['debug', 'Fix the missing semicolon.', 'show()\nreturn 0;', ';', 'The function call needs ;.'],
    ['code', 'Write the basic return statement from main.', '', 'return 0;', 'Use return 0.'],
    ['debug', 'Fix the missing brace.', 'int main() {\n  return 0;', '}', 'Close main.'],
    ['code', 'Write a C statement to store 50 in score.', '', 'int score = 50;', 'Use an integer declaration.']
  ],
  [
    ['debug', 'Fix the missing semicolon.', 'int a = 1\nint b = 2\nint c = 3;', ';', 'Add ; to the first declaration.'],
    ['code', 'Write a C function that returns a+b.', '', 'int add(int a, int b) { return a + b; }', 'Use a basic function.'],
    ['debug', 'Fix the missing return statement.', 'int add(int a, int b) {\n  int sum = a + b;\n}', 'return sum;', 'Return sum.'],
    ['code', 'Write a C loop that counts from 1 to 10.', '', 'for (int i = 1; i <= 10; i++) printf("%d", i);', 'Use a for loop.'],
    ['debug', 'Fix the loop increment.', 'for (int i = 0; i < 5; i--) {\n  printf("%d", i);\n}', 'i++', 'Increment i.'],
    ['code', 'Write a C condition that checks if age is 18 or more.', '', 'if (age >= 18)', 'Use >=.'],
    ['debug', 'Fix the comparison.', 'if (age => 18) {\n  printf("Adult");\n}', '>=', 'The operator is >=.'],
    ['code', 'Write a C statement to set a variable ready to 1.', '', 'int ready = 1;', 'Use an integer.'],
    ['debug', 'Fix the missing semicolon.', 'int ready = 1\nprintf("%d", ready);', ';', 'Add ;.'],
    ['code', 'Write a C condition that checks whether x is odd.', '', 'if (x % 2 != 0)', 'Use modulo and !=.'],
    ['debug', 'Fix the comparison operator.', 'if (x % 2 =! 0) {\n  printf("Odd");\n}', '!=', 'Use !=.'],
    ['code', 'Write a C statement to store the result of 10 - 4 in x.', '', 'int x = 10 - 4;', 'Use -.'],
    ['debug', 'Fix the missing semicolon.', 'int x = 10 - 4\nprintf("%d", x);', ';', 'Add ;.'],
    ['code', 'Write a C statement to store 3*4 in product.', '', 'int product = 3 * 4;', 'Use *.'],
    ['debug', 'Fix the missing operator.', 'int product = 3 4;', '*', 'Use multiplication.'],
    ['code', 'Write a C statement to store 20/5 in result.', '', 'int result = 20 / 5;', 'Use /.'],
    ['debug', 'Fix the missing semicolon.', 'int result = 20 / 5\nprintf("%d", result);', ';', 'Add ;.'],
    ['code', 'Write a C statement to print a newline after Hello.', '', 'printf("Hello\\n");', 'Use \n.'],
    ['debug', 'Fix the missing quote.', 'printf("Hello);', '"', 'Close the string with a quote.']
  ]
];

function normalizeQuestion(raw, group, index) {
  return { id: raw.id || `${group + 1}-${index + 1}`, group, index, type: raw.type || 'debug', question: raw.question || '', code: raw.code || '', answer: raw.answer || '', hint: raw.hint || '' };
}
function defaultDb() {
  const groups = defaultQuestions.map((group, gi) => group.map((q, i) => normalizeQuestion({ type:q[0], question:q[1], code:q[2], answer:q[3], hint:q[4] }, gi, i)));
  return { teams: [], questionGroups: groups, settings: { sound: true } };
}
if (!fs.existsSync(DB)) fs.writeFileSync(DB, JSON.stringify(defaultDb(), null, 2));
const read = () => JSON.parse(fs.readFileSync(DB, 'utf8'));
const write = d => fs.writeFileSync(DB, JSON.stringify(d, null, 2));
const ensureSchema = () => {
  const d = read();
  if (!Array.isArray(d.teams)) d.teams = [];
  if (!Array.isArray(d.questionGroups) || d.questionGroups.length !== 6) {
    d.questionGroups = defaultDb().questionGroups;
  } else {
    d.questionGroups = d.questionGroups.map((g, gi) => Array.isArray(g) ? g.map((q, i) => normalizeQuestion(q, gi, i)) : defaultDb().questionGroups[gi]);
  }
  if (!d.settings) d.settings = { sound: true };
  write(d);
};
ensureSchema();
const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const admin = (req, res, next) => { if (req.headers['x-admin-key'] !== ADMIN_KEY) return res.status(401).json({ message: 'Unauthorized' }); next(); };

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.get('/api/health', (req, res) => res.json({ ok: true, app: 'save-your-partner-v7' }));

// All database mutations are serialized. This keeps simultaneous registrations,
// approvals and game completions from overwriting one another in the JSON store.
let dbWriteChain = Promise.resolve();
function updateDb(mutator) {
  const job = dbWriteChain.then(async () => {
    const d = read();
    const result = await mutator(d);
    write(d);
    return result;
  });
  dbWriteChain = job.catch(() => {});
  return job;
}

app.post('/api/teams/register', async (req, res) => {
  const { teamName, members } = req.body;
  if (!teamName || !Array.isArray(members) || members.length !== 2) return res.status(400).json({ message: 'Team name and exactly two members are required.' });
  if (members.some(m => !m?.name || !m?.phone || !m?.email)) return res.status(400).json({ message: 'Both members need name, phone and email.' });
  try {
    const team = await updateDb(d => {
      const cleanMembers = members.map(m => ({ name:String(m.name).trim(), phone:String(m.phone).trim(), email:String(m.email).trim().toLowerCase() }));
      const t = { id: id(), code: `SYP-${Math.floor(1000 + Math.random() * 9000)}`, teamName:String(teamName).trim(), members:cleanMembers, playableMemberIndex:0, status:'pending', createdAt:new Date().toISOString(), result:null, category:'grouped', questionGroup:1, startedAt:null };
      d.teams.push(t); return t;
    });
    res.json({ team });
  } catch (e) { res.status(500).json({ message:'Could not register team.' }); }
});

app.get('/api/teams/:id', (req, res) => { const t = read().teams.find(x => x.id === req.params.id); if (!t) return res.status(404).json({ message:'Team not found' }); res.json(t); });
app.get('/api/teams/:id/result', (req,res) => { const t=read().teams.find(x=>x.id===req.params.id); if(!t)return res.status(404).json({message:'Team not found'}); res.json({time:t.result?.time??null,player:t.result?.player??null}); });
app.get('/api/admin/teams', admin, (req,res) => res.json(read().teams));
app.get('/api/admin/questions', admin, (req,res) => res.json(read().questionGroups));

app.put('/api/admin/questions/:group/:index', admin, async (req,res) => {
  const g = Number(req.params.group); const i = Number(req.params.index);
  if (!Number.isInteger(g) || g < 0 || g > 5 || !Number.isInteger(i) || i < 0 || i > 19) return res.status(400).json({message:'Invalid group or question number.'});
  try {
    const q = await updateDb(d => {
      if (!d.questionGroups[g]?.[i]) return null;
      const incoming = req.body || {};
      const type = incoming.type === 'code' ? 'code' : 'debug';
      const question = String(incoming.question ?? '').trim();
      const answer = String(incoming.answer ?? '').trim();
      if (!question || !answer) return {error:'Question and expected answer/fix are required.'};
      d.questionGroups[g][i] = normalizeQuestion({ ...d.questionGroups[g][i], ...incoming, type, question, answer }, g, i);
      d.questionGroups[g][i].updatedAt = new Date().toISOString();
      return d.questionGroups[g][i];
    });
    if (!q) return res.status(404).json({message:'Question not found'});
    if (q.error) return res.status(400).json({message:q.error});
    res.json(q);
  } catch (e) { res.status(500).json({message:'Could not save question'}); }
});

app.post('/api/admin/questions/:group', admin, async (req,res) => {
  const g=Number(req.params.group);
  try {
    const q = await updateDb(d => {
      if(!d.questionGroups[g]) return {error:'Group not found'};
      if(d.questionGroups[g].length>=20)return {error:'Each group is limited to 20 questions.'};
      const i=d.questionGroups[g].length; const q=normalizeQuestion(req.body||{},g,i); d.questionGroups[g].push(q); return q;
    });
    if(q?.error)return res.status(400).json({message:q.error});
    res.json(q);
  } catch { res.status(500).json({message:'Could not add question'}); }
});

app.post('/api/admin/teams/:id/approve', admin, async (req,res) => {
  try {
    const t = await updateDb(d => {
      const team=d.teams.find(x=>x.id===req.params.id); if(!team)return null;
      const idx=Number(req.body.playableMemberIndex); const selectedGroup=Number(req.body.questionGroup);
      team.playableMemberIndex=Number.isInteger(idx)&&idx>=0&&idx<2?idx:0;
      team.questionGroup=Number.isInteger(selectedGroup)&&selectedGroup>=1&&selectedGroup<=6?selectedGroup:1;
      if(team.status!=='finished') team.status='approved';
      return team;
    });
    if(!t)return res.status(404).json({message:'Team not found'});
    res.json(t);
  } catch { res.status(500).json({message:'Could not approve team'}); }
});
app.post('/api/admin/teams/:id/finish', admin, async (req,res) => { try { const t=await updateDb(d=>{const t=d.teams.find(x=>x.id===req.params.id);if(!t)return null;t.status='finished';return t});if(!t)return res.status(404).json({message:'Team not found'});res.json(t);}catch{res.status(500).json({message:'Could not finish team'})} });

app.post('/api/game/start/:id', async (req,res) => {
  try {
    const result = await updateDb(d => {
      const t=d.teams.find(x=>x.id===req.params.id);
      if(!t)return {error:'Team not found',code:404};
      if(t.status!=='approved')return {error:'Admin approval required.',code:403};
      const group=Number(t.questionGroup||1); const questions=(d.questionGroups[group-1]||[]).slice(0,20);
      if(questions.length<20)return {error:'Selected question group must contain all 20 questions.',code:500};
      t.startedAt=Date.now(); t.result=null; t.status='approved';
      const prisonerIndex=t.playableMemberIndex===0?1:0;
      return {team:t,group,questions,prisonerName:t.members[prisonerIndex]?.name||'PRINCE',prisonerMemberIndex:prisonerIndex};
    });
    if(result?.error)return res.status(result.code).json({message:result.error});
    res.json(result);
  } catch { res.status(500).json({message:'Could not start game'}); }
});

app.post('/api/game/complete/:id', async (req,res) => {
  try {
    const result=await updateDb(d=>{const t=d.teams.find(x=>x.id===req.params.id);if(!t)return null;const time=Math.max(0,Number(req.body.time)||0);t.result={time,completedAt:new Date().toISOString(),player:t.members[t.playableMemberIndex]?.name||t.members[0]?.name};t.status='finished';return t.result});
    if(!result)return res.status(404).json({message:'Team not found'});res.json(result);
  } catch { res.status(500).json({message:'Could not complete game'}); }
});

app.listen(4000,'0.0.0.0',()=>console.log('Save Your Partner V6 API running on port 4000'));
