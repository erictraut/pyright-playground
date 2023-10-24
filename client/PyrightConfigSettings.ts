/*
 * Copyright (c) Eric Traut
 * Information about the configuration settings in pyright.
 */

export interface PyrightConfigSetting {
    name: string;
    description: string;
    isEnabledInStrict: boolean;
}

export const configSettings: PyrightConfigSetting[] = [
    {
        name: 'disableBytesTypePromotions',
        description: 'Do not treat bytearray and memoryview as implicit subtypes of bytes',
        isEnabledInStrict: true,
    },
    {
        name: 'strictListInference',
        description: 'Infer strict types for list expressions',
        isEnabledInStrict: true,
    },
    {
        name: 'strictDictionaryInference',
        description: 'Infer strict types for dictionary expressions',
        isEnabledInStrict: true,
    },
    {
        name: 'strictSetInference',
        description: 'Infer strict types for set expressions',
        isEnabledInStrict: true,
    },
    {
        name: 'reportConstantRedefinition',
        description: 'Controls reporting of attempts to redefine variables that are in all-caps',
        isEnabledInStrict: true,
    },
    {
        name: 'reportDeprecated',
        description: 'Controls reporting of use of deprecated class or function',
        isEnabledInStrict: true,
    },
    {
        name: 'reportDuplicateImport',
        description: 'Controls reporting of symbols or modules that are imported more than once',
        isEnabledInStrict: true,
    },
    {
        name: 'reportFunctionMemberAccess',
        description: 'Controls reporting of member accesses on function objects',
        isEnabledInStrict: true,
    },
    {
        name: 'reportIncompatibleMethodOverride',
        description:
            'Controls reporting of method overrides in subclasses that redefine the method in an incompatible way',
        isEnabledInStrict: true,
    },
    {
        name: 'reportIncompatibleVariableOverride',
        description:
            'Controls reporting of overrides in subclasses that redefine a variable in an incompatible way',
        isEnabledInStrict: true,
    },
    {
        name: 'reportIncompleteStub',
        description:
            'Controls reporting of incomplete type stubs that declare a module-level __getattr__ function',
        isEnabledInStrict: true,
    },
    {
        name: 'reportInconsistentConstructor',
        description:
            'Controls reporting of __init__ and __new__ methods whose signatures are inconsistent',
        isEnabledInStrict: true,
    },
    // Stubs are not modeled in the playground, so this setting is not relevant.
    // {
    //     name: 'reportInvalidStubStatement',
    //     description: 'Controls reporting of type stub statements that do not conform to PEP 484',
    //     isEnabledInStrict: true,
    // },
    {
        name: 'reportMatchNotExhaustive',
        description:
            'Controls reporting of match statements that do not exhaustively match all possible values',
        isEnabledInStrict: true,
    },
    {
        name: 'reportMissingParameterType',
        description: 'Controls reporting input parameters that are missing a type annotation',
        isEnabledInStrict: true,
    },
    {
        name: 'reportMissingTypeArgument',
        description: 'Controls reporting generic class reference with missing type arguments',
        isEnabledInStrict: true,
    },
    {
        name: 'reportOverlappingOverload',
        description:
            'Controls reporting of function overloads that overlap in signature and obscure each other or do not agree on return type',
        isEnabledInStrict: true,
    },
    {
        name: 'reportPrivateUsage',
        description:
            'Controls reporting of private variables and functions used outside of the owning class or module and usage of protected members outside of subclasses',
        isEnabledInStrict: true,
    },
    {
        name: 'reportTypeCommentUsage',
        description: 'Controls reporting of deprecated type comment usage',
        isEnabledInStrict: true,
    },
    {
        name: 'reportUnknownArgumentType',
        description: 'Controls reporting argument expressions whose types are unknown',
        isEnabledInStrict: true,
    },
    {
        name: 'reportUnknownLambdaType',
        description:
            'Controls reporting input and return parameters for lambdas whose types are unknown',
        isEnabledInStrict: true,
    },
    {
        name: 'reportUnknownMemberType',
        description: 'Controls reporting class and instance variables whose types are unknown',
        isEnabledInStrict: true,
    },
    {
        name: 'reportUnknownParameterType',
        description: 'Controls reporting input and return parameters whose types are unknown',
        isEnabledInStrict: true,
    },
    {
        name: 'reportUnknownVariableType',
        description: 'Controls reporting local variables whose types are unknown',
        isEnabledInStrict: true,
    },
    {
        name: 'reportUnnecessaryCast',
        description: 'Controls reporting calls to "cast" that are unnecessary',
        isEnabledInStrict: true,
    },
    {
        name: 'reportUnnecessaryComparison',
        description: 'Controls reporting the use of "==" or "!=" comparisons that are unnecessary',
        isEnabledInStrict: true,
    },
    {
        name: 'reportUnnecessaryContains',
        description: 'Controls reporting the use of "in" operations that are unnecessary',
        isEnabledInStrict: true,
    },
    {
        name: 'reportUnnecessaryIsInstance',
        description:
            'Controls reporting calls to "isinstance" or "issubclass" where the result is statically determined to be always true',
        isEnabledInStrict: true,
    },
    {
        name: 'reportUnusedClass',
        description: 'Controls reporting of private classes that are not accessed',
        isEnabledInStrict: true,
    },
    {
        name: 'reportUnusedImport',
        description:
            'Controls reporting of imported symbols that are not referenced within the source file',
        isEnabledInStrict: true,
    },
    {
        name: 'reportUnusedFunction',
        description: '',
        isEnabledInStrict: true,
    },
    {
        name: 'reportUnusedVariable',
        description: 'Controls reporting of private functions or methods that are not accessed',
        isEnabledInStrict: true,
    },
    {
        name: 'reportUntypedBaseClass',
        description:
            'Controls reporting of a base class of an unknown type, which obscures most type checking for the class',
        isEnabledInStrict: true,
    },
    {
        name: 'reportUntypedClassDecorator',
        description:
            'Controls reporting of class decorators without type annotations, which obscure class types',
        isEnabledInStrict: true,
    },
    {
        name: 'reportUntypedFunctionDecorator',
        description:
            'Controls reporting of function decorators without type annotations, which obscure function types',
        isEnabledInStrict: true,
    },
    {
        name: 'reportUntypedNamedTuple',
        description:
            'Controls reporting of a named tuple definition that does not contain type information',
        isEnabledInStrict: true,
    },
    {
        name: 'deprecateTypingAliases',
        description: 'Treat typing-specific aliases to standard types as deprecated',
        isEnabledInStrict: false,
    },
    {
        name: 'enableExperimentalFeatures',
        description:
            'Enable the use of experimental features that are not part of the Python typing spec',
        isEnabledInStrict: false,
    },
    {
        name: 'reportCallInDefaultInitializer',
        description:
            'Controls reporting usage of function calls within a default value initializer expression',
        isEnabledInStrict: false,
    },
    {
        name: 'reportImplicitOverride',
        description:
            'Controls reporting overridden methods that are missing an "@override" decorator',
        isEnabledInStrict: false,
    },
    {
        name: 'reportImplicitStringConcatenation',
        description: 'Controls reporting usage of implicit concatenation of string literals',
        isEnabledInStrict: false,
    },
    {
        name: 'reportMissingSuperCall',
        description:
            'Controls reporting of missing call to parent class for inherited "__init__" methods',
        isEnabledInStrict: false,
    },
    {
        name: 'reportPropertyTypeMismatch',
        description: 'Controls reporting of property getter/setter type mismatches',
        isEnabledInStrict: false,
    },
    {
        name: 'reportShadowedImports',
        description: 'Controls reporting of shadowed imports of stdlib modules',
        isEnabledInStrict: false,
    },
    {
        name: 'reportUninitializedInstanceVariable',
        description:
            'Controls reporting of instance variables that are not initialized in the constructor',
        isEnabledInStrict: false,
    },
    {
        name: 'reportUnnecessaryTypeIgnoreComment',
        description: 'Controls reporting of "# type: ignore" comments that have no effect',
        isEnabledInStrict: false,
    },
    {
        name: 'reportUnusedCallResult',
        description: 'Controls reporting of call expressions whose results are not consumed',
        isEnabledInStrict: false,
    },
];
