const MOCK_AMPLITUDES = [
  0.3, 0.6, 0.9, 0.5, 0.7, 0.4, 0.8, 0.6, 0.3, 0.9,
  0.5, 0.7, 0.4, 0.6, 0.8, 0.3, 0.5, 0.9, 0.6, 0.4,
];

export function getMockWaveformData(selectedDetail) {
  if (!selectedDetail) {
    return [];
  }

  return MOCK_AMPLITUDES;
}
