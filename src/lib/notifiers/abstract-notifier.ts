export type AbstractNotifierProps = {
	validationMessage: string;
};

export abstract class AbstractNotifier {
	constructor(props: AbstractNotifierProps) {
		this.validationMessage = props.validationMessage;
	}
	protected validationMessage: string;
	abstract sendAlert(message: string): Promise<void>;

	async validate(): Promise<void> {
		try {
			await this.sendAlert(this.validationMessage);
		} catch (error) {
			throw new Error(`Validation failed: ${error}`);
		}
	}
}
