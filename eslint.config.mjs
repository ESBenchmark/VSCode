import core from "@kaciras/eslint-config-core";
import typescript from "@kaciras/eslint-config-typescript";

export default [...core, ...typescript,
	{
		ignores: ["dist/**"],
	},
	{
		rules: {
			"kaciras/import-specifier-order": "warn",
		},
	},
];
