#define DR_MP3_IMPLEMENTATION
#include "../lib/dr_libs/dr_mp3.h"

#include <stdlib.h>

typedef struct ExoMp3Audio {
  drmp3_int16 *pcm;
  size_t pcm_len;
  unsigned int sample_rate;
  unsigned int channels;
} ExoMp3Audio;

void *exo_mp3_load(const void *data, size_t len) {
  if (data == NULL || len == 0) {
    return NULL;
  }

  drmp3 mp3;
  if (!drmp3_init_memory(&mp3, data, len, NULL)) {
    return NULL;
  }

  drmp3_uint64 frame_count = drmp3_get_pcm_frame_count(&mp3);
  if (frame_count == 0) {
    drmp3_uninit(&mp3);
    return NULL;
  }

  unsigned int channels = mp3.channels;
  unsigned int sample_rate = mp3.sampleRate;
  if (channels == 0) {
    drmp3_uninit(&mp3);
    return NULL;
  }

  size_t sample_count = (size_t)frame_count * (size_t)channels;
  drmp3_int16 *pcm = (drmp3_int16 *)malloc(sample_count * sizeof(drmp3_int16));
  if (pcm == NULL) {
    drmp3_uninit(&mp3);
    return NULL;
  }

  drmp3_uint64 frames_read = drmp3_read_pcm_frames_s16(&mp3, frame_count, pcm);
  drmp3_uninit(&mp3);
  if (frames_read == 0) {
    free(pcm);
    return NULL;
  }

  ExoMp3Audio *audio = (ExoMp3Audio *)malloc(sizeof(ExoMp3Audio));
  if (audio == NULL) {
    free(pcm);
    return NULL;
  }

  audio->pcm = pcm;
  audio->pcm_len = (size_t)frames_read * (size_t)channels * sizeof(drmp3_int16);
  audio->sample_rate = sample_rate;
  audio->channels = channels;
  return audio;
}

void exo_mp3_destroy(void *handle) {
  ExoMp3Audio *audio = (ExoMp3Audio *)handle;
  if (audio == NULL) {
    return;
  }
  free(audio->pcm);
  free(audio);
}

const void *exo_mp3_pcm(void *handle) {
  ExoMp3Audio *audio = (ExoMp3Audio *)handle;
  return audio != NULL ? audio->pcm : NULL;
}

size_t exo_mp3_pcm_len(void *handle) {
  ExoMp3Audio *audio = (ExoMp3Audio *)handle;
  return audio != NULL ? audio->pcm_len : 0;
}

int exo_mp3_sample_rate(void *handle) {
  ExoMp3Audio *audio = (ExoMp3Audio *)handle;
  return audio != NULL ? (int)audio->sample_rate : 0;
}

int exo_mp3_channels(void *handle) {
  ExoMp3Audio *audio = (ExoMp3Audio *)handle;
  return audio != NULL ? (int)audio->channels : 0;
}
