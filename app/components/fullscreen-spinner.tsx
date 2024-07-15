import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { LoaderCircleIcon } from "lucide-react";

export const FullscreenSpinner = ({ show }: { show: boolean }) => {
	const [portalElement, setPortalElement] = useState<Element>();

	useEffect(() => {
		const element = document.querySelector("#spinner-portal");
		if (!element) {
			throw new Error("element #spinner-portal not found");
		}
		setPortalElement(element);
	}, []);

	if (!portalElement || !show) {
		return null;
	}

	return createPortal(
		<div className="fixed top-0 left-0 w-screen h-screen grid place-items-center bg-black bg-opacity-50">
			<LoaderCircleIcon className="animate-spin" />
		</div>,
		portalElement
	);
};
