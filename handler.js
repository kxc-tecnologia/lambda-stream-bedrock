const util = require('util');
const stream = require('stream');
const { Readable } = stream;
const pipeline = util.promisify(stream.pipeline);

const {
	BedrockRuntimeClient,
	InvokeModelWithResponseStreamCommand,
	InvokeModelCommand
} = require('@aws-sdk/client-bedrock-runtime'); // ES Modules import

const bedrock = new BedrockRuntimeClient({ region: 'us-east-1' });

function parseBase64(message) {
	return JSON.parse(Buffer.from(message, 'base64').toString('utf-8'));
}

const PROMPT = '';

exports.handler = awslambda.streamifyResponse(
	async (event, responseStream, _context) => {
		const body = JSON.parse(event.body)
		const claudPrompt = `System:${PROMPT}\n\nHuman:${body.human}\n\nAssistant:`;

		const input = {
		  modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
		  contentType: "application/json",
		  accept: "application/json",
		  body: JSON.stringify({
		    anthropic_version: "bedrock-2023-05-31",
		    max_tokens: 1000,
		    messages: [
		      {
		        role: "user",
		        content: [
		          {
		            type: "text",
		            text: claudPrompt,
		          },
		        ],
		      },
		    ],
		  }),
		};
		
		
		
		console.log(input);

		const command = new InvokeModelWithResponseStreamCommand(input);

		const response = await bedrock.send(command);
		let completeMessage = "";
		console.log(response)
		for await (const item of response.body) {
			const chunk = JSON.parse(new TextDecoder().decode(item.chunk.bytes));
	    	const chunk_type = chunk.type;
	
		    if (chunk_type === "content_block_delta") {
		      const text = chunk.delta.text;
		      completeMessage = completeMessage + text;
		      
		      responseStream.write(text);
		    }
		}

		responseStream.end();
	}
);

exports.handler2 = async (event,  _context) => {
	const body = JSON.parse(event.body)
	const claudPrompt = `System:${PROMPT}\n\nHuman:${body.human}\n\nAssistant:`;

	const input = {
		modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
		contentType: "application/json",
		accept: "application/json",
		body: JSON.stringify({
		anthropic_version: "bedrock-2023-05-31",
		max_tokens: 1000,
		messages: [
			{
			role: "user",
			content: [
				{
				type: "text",
				text: claudPrompt,
				},
			],
			},
		],
		}),
	};
	
	
	
	console.log(input);

	const command = new InvokeModel(input);

	const response = await bedrock.send(command);
	
	console.log(response)

	return response
}
