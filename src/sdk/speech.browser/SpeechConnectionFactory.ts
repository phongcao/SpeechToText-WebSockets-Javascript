import { WebsocketConnection } from "../../common.browser/Exports";
import {
    IConnection,
    IStringDictionary,
    Promise,
    Storage,
} from "../../common/Exports";
import {
    AuthInfo,
    IAuthentication,
    IConnectionFactory,
    RecognitionMode,
    RecognizerConfig,
    SpeechEndpoint,
    SpeechResultFormat,
    WebsocketMessageFormatter,
} from "../speech/Exports";

const TestHooksParamName: string = "testhooks";
const ConnectionIdHeader: string = "X-ConnectionId";
const CID: string = "cid";
const BingEndpoint: string = "wss://speech.platform.bing.com";
const CRISEndpoint: string = "wss://westus.stt.speech.microsoft.com";

export class SpeechConnectionFactory implements IConnectionFactory {

    public Create = (
        config: RecognizerConfig,
        authInfo: AuthInfo,
        connectionId?: string): IConnection => {

        let endpoint = "";
        switch (config.RecognitionMode) {
            case RecognitionMode.Conversation:
                endpoint = this.getHost(config.SpeechEndpoint) + this.ConversationRelativeUri;
                break;
            case RecognitionMode.Dictation:
                endpoint = this.getHost(config.SpeechEndpoint) + this.DictationRelativeUri;
                break;
            default:
                endpoint = this.getHost(config.SpeechEndpoint) + this.InteractiveRelativeUri; // default is interactive
                break;
        }

        const queryParams: IStringDictionary<string> = {
            format: SpeechResultFormat[config.Format].toString().toLowerCase(),
            language: config.Language,
        };

        if (this.IsDebugModeEnabled) {
            queryParams[TestHooksParamName] = "1";
        }

        if (config.SpeechEndpoint === SpeechEndpoint.CRIS) {
            queryParams[CID] = config.Cid;
        }

        const headers: IStringDictionary<string> = {};
        headers[authInfo.HeaderName] = authInfo.Token;
        headers[ConnectionIdHeader] = connectionId;

        return new WebsocketConnection(endpoint, queryParams, headers, new WebsocketMessageFormatter(), connectionId);
    }

    private getHost(endpoint: SpeechEndpoint): string {
        return Storage.Local.GetOrAdd("Host", (endpoint === SpeechEndpoint.Bing) ? BingEndpoint : CRISEndpoint);
    }

    private get InteractiveRelativeUri(): string {
        return Storage.Local.GetOrAdd("InteractiveRelativeUri", "/speech/recognition/interactive/cognitiveservices/v1");
    }

    private get ConversationRelativeUri(): string {
        return Storage.Local.GetOrAdd("ConversationRelativeUri", "/speech/recognition/conversation/cognitiveservices/v1");
    }

    private get DictationRelativeUri(): string {
        return Storage.Local.GetOrAdd("DictationRelativeUri", "/speech/recognition/dictation/cognitiveservices/v1");
    }

    private get IsDebugModeEnabled(): boolean {
        const value = Storage.Local.GetOrAdd("IsDebugModeEnabled", "false");
        return value.toLowerCase() === "true";
    }
}
