import * as assert from 'assert';
import * as vscode from 'vscode';
import { SmoresDataFile } from '../../../model/smoresDataFile';
import { extensionPath } from '../../runTest';

suite('Smores Data File Test Suite', () => {
  test('Get/Set project file path', () => {
    const testPath = "C:\\A\\made\\up\\path";
    assert.strictEqual(SmoresDataFile.getProjectFilepath(), undefined);
    SmoresDataFile.setProjectFilepath(testPath);
    assert.strictEqual(SmoresDataFile.getProjectFilepath(), testPath);
    SmoresDataFile.clearProjectFilepath();
    assert.strictEqual(SmoresDataFile.getProjectFilepath(), undefined);
  });
  test('Get extension path', () => {
    assert.strictEqual(SmoresDataFile.getExtensionPath(), extensionPath);
  });
});
