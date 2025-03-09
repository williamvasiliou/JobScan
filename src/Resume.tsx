const COMMAND = ''
const ARGS = []
const OPTIONS = false

const schema = typeof(COMMAND) === 'string' && COMMAND.trim().length > 0 &&
	typeof(ARGS) === 'object' && ARGS.every((arg) => typeof(arg) === 'string' && arg.trim().length > 0) &&
	(OPTIONS === false || typeof(OPTIONS) === 'object')

const newChild = OPTIONS ? (
	async (spawn) => await spawn(COMMAND, ARGS, OPTIONS)
) : (
	async (spawn) => await spawn(COMMAND, ARGS)
)

const attachment = (id) => `attachment; filename=${new Date().toISOString().replaceAll(/[^0-9]/g, '').slice(0, 14)}-resume-${id()}.pdf`

const create = async (spawn, res, id, labels) => {
	if (!labels) {
		return false
	}

	const child = await newChild(spawn)

	child.on('spawn', () => {
		res.status(200).set({
			'Content-Type': 'application/pdf',
			'Content-Disposition': attachment(id),
		})

		labels.forEach((label) => child.stdin.write(`${label}\n`))
		child.stdin.end()
	})

	child.stdout.on('data', (data) => {
		res.write(data)
	})

	child.on('exit', () => {
		res.end()
	})

	child.on('error', () => {
		res.status(500).json({})
	})

	return true
}

export const createResume = schema ? (
	async (spawn, res, id, labels) => await create(spawn, res, id, await labels())
) : (
	async () => false
)

export const ResumeAction = schema ? ({
	Job: (id) => (
		<>
			<br/>
			<br/>
			<a href={`/jobs/${id}/resume`} target='_blank'>Resume</a>
		</>
	),
	Analysis: (id) => (
		<>
			<br/>
			<br/>
			<a href={`/analysis/${id}/resume`} target='_blank'>Resume</a>
		</>
	),
	AnalysisJobs: (id, jobId) => (
		<>
			<br/>
			<br/>
			<a href={`/analysis/${id}/jobs/${jobId}/resume`} target='_blank'>Resume</a>
		</>
	),
}) : ({
	Job: () => [],
	Analysis: () => [],
	AnalysisJobs: () => [],
})
