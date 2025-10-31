/* 
Desenvolvido para a matéria de Typescript, pelos alunos:

Gabriel Filipe dos Santos RA: 2517645
Italo Guilherme Pinheiro Rodrigues RA: 2526314
Pedro Henrique Assis de Oliveira RA: 2508585
Matheus Gomes Nagy RA: 2508094
Joaquim da Silva dos Santos RA:2502410
*/

import * as readlineSync from "readline-sync";
import { Pool } from "pg";


// ======================
// Conexão com PostgreSQL
// ======================
const pool = new Pool({
  host: "localhost",
  user: "quizuser",
  password: "quizpass",
  database: "quizdb",
  port: 5432,
});


// ======================
// Estrutura de dados local
// ======================
interface Question {
  question: string;
  resposta: string;
  options: string[];
}

let questions: Question[] = [];

// ======================
// Funções de Banco de Dados
// ======================
async function iniciarDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      pontuacao INT DEFAULT 0
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      question TEXT NOT NULL,
      resposta TEXT NOT NULL,
      options JSONB NOT NULL
    );
  `);
}

async function adicionarPergunta(question: string, resposta: string, options: string[]) {
  await pool.query(
    "INSERT INTO questions (question, resposta, options) VALUES ($1, $2, $3)",
    [question, resposta, JSON.stringify(options)]
  );
}

async function obterPerguntas() {
  const result = await pool.query("SELECT * FROM questions ORDER BY id");
  return result.rows;
}

async function deletarPergunta(id: number) {
  await pool.query("DELETE FROM questions WHERE id = $1", [id]);
}

async function salvarPontuacao(nome: string, pontuacao: number) {
  await pool.query("INSERT INTO usuarios (nome, pontuacao) VALUES ($1, $2)", [nome, pontuacao]);
}

// ======================
// Funções do Sistema
// ======================
async function cadastrarPergunta() {
  console.log("\nCadastro de Perguntas\n");

  const question = readlineSync.question("Digite a pergunta: ");
  const options: string[] = [];

  for (let i = 0; i < 4; i++) {
    options.push(readlineSync.question(`Opcao ${i + 1}: `));
  }

  let correctIndex: number;
  let resposta: string;
  while (true) {
    correctIndex = readlineSync.questionInt("Numero da resposta correta (1-4): ") - 1;
    if (correctIndex >= 0 && correctIndex < options.length && options[correctIndex] !== undefined) {
      resposta = options[correctIndex]!;
      break;
    }
    console.log("Índice inválido. Digite um número entre 1 e 4.");
  }

  await adicionarPergunta(question, resposta, options);
  console.log("\nPergunta / Resposta cadastrada com sucesso!");
}

async function executarQuiz() {
  console.log("\nIniciando o Quiz\n");
  const questions = await obterPerguntas();

  if (questions.length === 0) {
    console.log("Nenhuma pergunta cadastrada ainda!");
    return;
  }

  const nome = readlineSync.question("Digite seu nome: ");
  let pontuacao = 0;

  for (const q of questions) {
    console.log(`\n${q.id}) ${q.question}`);
    q.options.forEach((opt: string, i: number) => console.log(`${i + 1}) ${opt}`));

    const answerIndex = readlineSync.questionInt("Sua resposta (1-4): ") - 1;
    const answer = q.options[answerIndex];

    if (answer === q.resposta) {
      console.log("Certa Resposta!");
      pontuacao += 10;
    } else {
      console.log(`Errouuuuu, Resposta correta: ${q.resposta}`);
    }
  }

  console.log(`\n ${nome}, sua pontuação foi: ${pontuacao} pontos.`);
  await salvarPontuacao(nome, pontuacao);
}


async function excluirPergunta() {
  console.log("\nExcluir Pergunta\n");

  const questions = await obterPerguntas();
  if (questions.length === 0) {
    console.log("Nenhuma pergunta cadastrada ainda!");
    return;
  }

  console.log("\nLista de perguntas:");
  for (const q of questions) {
    console.log(`${q.id}) ${q.question}`);
  }

  const id = readlineSync.questionInt("Digite o ID da pergunta que deseja excluir: ");
  await deletarPergunta(id);
  console.log("Pergunta excluída com sucesso!");
}

// ======================
// Menu Principal
// ======================
async function main() {
  await iniciarDB();

  while (true) {
    console.log("\n==============================");
    console.log("SHOW DO MILHÃO - QUIZ");
    console.log("==============================");
    console.log("1 - Cadastrar perguntas e respostas");
    console.log("2 - Executar quiz");
    console.log("3 - Excluir pergunta");
    console.log("4 - Sair");
    console.log("==============================");

    const opcao = readlineSync.questionInt("Escolha uma opcao: ");

    switch (opcao) {
      case 1:
        cadastrarPergunta();
        break;
      case 2:
        await executarQuiz();
        break;
      case 3:
        await excluirPergunta();
        break;
      case 4:
        console.log("\nSaindo...");
        await pool.end();
        process.exit(0);
      default:
        console.log("Opção inválida!");
    }
  }
}

main().catch((err) => console.error("Erro:", err));
