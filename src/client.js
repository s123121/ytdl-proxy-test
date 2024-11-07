import ffmpeg from 'fluent-ffmpeg';
import { YtdlCore, toPipeableStream } from '@ybd-project/ytdl-core';

const BASE_URL = 'http://localhost:8787';

const ytdl = new YtdlCore({
	includesRelatedVideo: false,
	includesOriginalFormatData: true,
	logDisplay: ['info', 'error', 'debug', 'warning'],
	originalProxy: {
		base: BASE_URL,
		download: `${BASE_URL}/download`,
		urlQueryName: 'url',
	},
});

function extractAudio(inputPath, outputPath) {
	return new Promise((resolve, reject) => {
		ffmpeg(inputPath)
			.audioBitrate(128)
			// .outputOptions('-map 0:a')
			.noVideo()
			.output(outputPath)
			.on('end', () => resolve(true))
			.on('error', (err) => {
				console.log(err);
				reject(err);
			})
			.run();
	});
}

const filterFunc = (format) => {
	let cond = format.hasAudio && !format.hasVideo;
	cond = format?.audioTrack ? cond && format.audioTrack.audioIsDefault : cond;
	return cond;
};

const YOUTUBE_URL = 'https://www.youtube.com/watch?v=E55uSCO5D2w';
ytdl
	.getFullInfo(YOUTUBE_URL)
	.then(async (info) => {
		const stream = toPipeableStream(await ytdl.downloadFromInfo(info, { filter: filterFunc }));
		// THIS WORK IN 6.0.4
		// const stream = await ytdl.downloadFromInfo(info, { filter: filterFunc, streamType: 'nodejs' })
		extractAudio(stream, './output.mp3');
	})
	.catch((err) => {
		console.error(err);
	});
