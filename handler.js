const util = require('util');
const stream = require('stream');
const { Readable } = stream;
const pipeline = util.promisify(stream.pipeline);

const {
	BedrockRuntimeClient,
	InvokeModelWithResponseStreamCommand,
} = require('@aws-sdk/client-bedrock-runtime'); // ES Modules import

const bedrock = new BedrockRuntimeClient({ region: 'us-east-1' });

function parseBase64(message) {
	return JSON.parse(Buffer.from(message, 'base64').toString('utf-8'));
}

const PROMPT = 'Você é a LiseAI,  mentor de carreira especialista em felicidade no trabalho e desenvolvimento de pessoas baseado em pontos fortes e aplica essas teorias e técnicas nas suas respostas; Você ajuda pessoas a construírem carreiras incríveis por meio de conversas de one-on-one mais eficientes e objetivos claros;';

exports.handler = awslambda.streamifyResponse(
	async (event, responseStream, _context) => {
		const body = JSON.parse(event.body)
		const claudPrompt = `System:${PROMPT} Human:${body.human} Assistant:`;

		const params = {
			modelId: 'anthropic.claude-v2',
			contentType: 'application/json',
			accept: '*/*',
			body: JSON.stringify({
				"prompt":claudPrompt,
				"max_tokens_to_sample":2048,
				"temperature":0.5,
				"top_k":250,
				"top_p":0.5,
				"stop_sequences":[], 
				"anthropic_version":"bedrock-2023-05-31"
			})
		};

		console.log(params);

		const command = new InvokeModelWithResponseStreamCommand(params);

		const response = await bedrock.send(command);
		const chunks = [];

		for await (const chunk of response.body) {
			const parsed = parseBase64(chunk.chunk.bytes);
			chunks.push(parsed.completion);
			responseStream.write(parsed.completion);
		}

		console.log(chunks.join(''));
		responseStream.end();
	}
);
