import {
  parseFileReference,
  serializeFileReference,
} from './file-storage.service';

describe('R1: stored file references retain Cloudinary delivery metadata privately', () => {
  it('round-trips publicId, resourceType and format through a compact versioned value', () => {
    const stored = serializeFileReference({
      publicId: 'odc/ODC-2026-00001/evidence/abc123',
      resourceType: 'image',
      format: 'png',
    });

    expect(stored).toBe(
      'cloudinary:v1:image:png:odc/ODC-2026-00001/evidence/abc123',
    );
    expect(stored).not.toMatch(/^https?:\/\//);
    expect(parseFileReference(stored)).toEqual({
      publicId: 'odc/ODC-2026-00001/evidence/abc123',
      resourceType: 'image',
      format: 'png',
    });
  });
});

describe('R3: legacy file references remain readable without re-uploading', () => {
  it('parses a historical publicId with missing delivery metadata', () => {
    expect(parseFileReference('odc/ODC-2026-00001/invoice/legacy123')).toEqual({
      publicId: 'odc/ODC-2026-00001/invoice/legacy123',
    });
  });
});
