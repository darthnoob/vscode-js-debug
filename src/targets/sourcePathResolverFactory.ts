/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { inject, injectable } from 'inversify';
import { IVueFileMapper } from '../adapter/vueFileMapper';
import { DebugType } from '../common/contributionUtils';
import { IFsUtils, LocalFsUtils } from '../common/fsUtils';
import { ILogger } from '../common/logging';
import { AnyLaunchConfiguration } from '../configuration';
import Dap from '../dap/api';
import { IInitializeParams } from '../ioc-extras';
import { BlazorSourcePathResolver } from './browser/blazorSourcePathResolver';
import { baseURL } from './browser/browserLaunchParams';
import { BrowserSourcePathResolver } from './browser/browserPathResolver';
import { NodeSourcePathResolver } from './node/nodeSourcePathResolver';

@injectable()
export class SourcePathResolverFactory {
  constructor(
    @inject(IInitializeParams) private readonly initializeParams: Dap.InitializeParams,
    @inject(ILogger) private readonly logger: ILogger,
    @inject(IVueFileMapper) private readonly vueMapper: IVueFileMapper,
    @inject(IFsUtils) private readonly fsUtils: LocalFsUtils,
  ) {}

  public create(c: AnyLaunchConfiguration) {
    if (
      c.type === DebugType.Node ||
      c.type === DebugType.Terminal ||
      c.type === DebugType.ExtensionHost
    ) {
      return new NodeSourcePathResolver(
        this.fsUtils,
        {
          resolveSourceMapLocations: c.resolveSourceMapLocations,
          basePath: c.cwd,
          sourceMapOverrides: c.sourceMapPathOverrides,
          remoteRoot: c.remoteRoot,
          localRoot: c.localRoot,
        },
        this.logger,
      );
    } else {
      const isBlazor = !!c.inspectUri;
      return new (isBlazor ? BlazorSourcePathResolver : BrowserSourcePathResolver)(
        this.vueMapper,
        this.fsUtils,
        {
          resolveSourceMapLocations: c.resolveSourceMapLocations,
          baseUrl: baseURL(c),
          localRoot: null,
          remoteRoot: null,
          pathMapping: { '/': c.webRoot, ...c.pathMapping },
          sourceMapOverrides: c.sourceMapPathOverrides,
          clientID: this.initializeParams.clientID,
          remoteFilePrefix: c.__remoteFilePrefix,
        },
        this.logger,
      );
    }
  }
}
