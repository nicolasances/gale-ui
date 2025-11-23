'use client';

interface SchemaViewerProps {
    schema: any;
    title: string;
}

export function SchemaViewer({ schema, title }: SchemaViewerProps) {
    if (!schema) return null;

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
            <div className="space-y-2">
                <SchemaProperty schema={schema} level={0} />
            </div>
        </div>
    );
}

interface SchemaPropertyProps {
    schema: any;
    level: number;
    propertyName?: string;
}

function SchemaProperty({ schema, level, propertyName }: SchemaPropertyProps) {
    const indent = level * 24;

    if (!schema) return null;

    // Handle object type with properties
    if (schema.type === 'object' && schema.properties) {
        return (
            <div style={{ marginLeft: `${indent}px` }}>
                {propertyName && (
                    <div className="mb-2">
                        <span className="font-mono text-sm font-semibold text-gray-900">{propertyName}</span>
                        <span className="ml-2 text-xs text-gray-500">object</span>
                        {schema.description && (
                            <p className="text-xs text-gray-600 mt-1">{schema.description}</p>
                        )}
                    </div>
                )}
                <div className="space-y-2 border-l-2 border-gray-200 pl-4">
                    {Object.entries(schema.properties).map(([key, value]: [string, any]) => (
                        <SchemaProperty
                            key={key}
                            schema={value}
                            level={0}
                            propertyName={key}
                        />
                    ))}
                </div>
            </div>
        );
    }

    // Handle array type
    if (schema.type === 'array' && schema.items) {
        return (
            <div style={{ marginLeft: `${indent}px` }}>
                {propertyName && (
                    <div className="mb-2">
                        <span className="font-mono text-sm font-semibold text-gray-900">{propertyName}</span>
                        <span className="ml-2 text-xs text-gray-500">array</span>
                        {schema.description && (
                            <p className="text-xs text-gray-600 mt-1">{schema.description}</p>
                        )}
                    </div>
                )}
                <div className="border-l-2 border-gray-200 pl-4">
                    <span className="text-xs text-gray-500 mb-2 block">Items:</span>
                    <SchemaProperty schema={schema.items} level={0} />
                </div>
            </div>
        );
    }

    // Handle primitive types
    const typeColor = getTypeColor(schema.type);
    const isRequired = schema.required || false;

    return (
        <div style={{ marginLeft: `${indent}px` }} className="py-1">
            <div className="flex items-start gap-2">
                {propertyName && (
                    <span className="font-mono text-sm font-semibold text-gray-900">
                        {propertyName}
                        {isRequired && <span className="text-red-500 ml-1">*</span>}
                    </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded ${typeColor} font-medium`}>
                    {schema.type || 'any'}
                </span>
                {schema.enum && (
                    <span className="text-xs text-gray-500">
                        enum: {schema.enum.join(', ')}
                    </span>
                )}
            </div>
            {schema.description && (
                <p className="text-xs text-gray-600 mt-1">{schema.description}</p>
            )}
            {schema.default !== undefined && (
                <p className="text-xs text-gray-500 mt-1">
                    Default: <span className="font-mono">{JSON.stringify(schema.default)}</span>
                </p>
            )}
        </div>
    );
}

function getTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
        string: 'bg-blue-100 text-blue-800',
        number: 'bg-green-100 text-green-800',
        integer: 'bg-green-100 text-green-800',
        boolean: 'bg-purple-100 text-purple-800',
        object: 'bg-orange-100 text-orange-800',
        array: 'bg-yellow-100 text-yellow-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
}
