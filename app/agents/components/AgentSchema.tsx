
interface SchemaProperty {
    name: string;
    type: string;
    description?: string;
    required: boolean;
}

export function SchemaProperties({ schema }: { schema: any }) {
    if (!schema || !schema.properties) {
        return <p className="text-xs text-gray-400">No properties defined</p>;
    }

    const requiredFields = schema.required || [];
    const properties: SchemaProperty[] = Object.entries(schema.properties).map(([name, prop]: [string, any]) => ({
        name,
        type: prop.type || 'unknown',
        description: prop.description,
        required: requiredFields.includes(name)
    }));

    return (
        <div className="space-y-3">
            {properties.map((prop) => (

                <div key={prop.name} className="border-l-4 border-blue-300 pl-3">

                    <div className="flex items-baseline gap-1">
                        <span className="font-mono text-sm font-medium text-gray-900">{prop.name}</span>
                        {prop.required && <span className="text-red-500 text-sm">*</span>}
                        <span className="text-xs text-gray-500">({prop.type})</span>
                    </div>

                    {prop.description && (
                        <p className="text-xs text-gray-600 mt-1">{prop.description}</p>
                    )}
                </div>

            ))}
        </div>
    );
}