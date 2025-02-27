import {
    CreateView,
    RenderBlock,
    useCurrentView,
    useOnSelect,
    WrapperWithPendantAndDragDrop,
} from '@toeverything/components/editor-core';
import { styled } from '@toeverything/components/ui';
import type {
    ComponentPropsWithoutRef,
    ComponentPropsWithRef,
    CSSProperties,
    ReactElement,
} from 'react';
import { forwardRef, useState } from 'react';
import style9 from 'style9';
import { SCENE_CONFIG } from '../blocks/group/config';
import { BlockContainer } from '../components/BlockContainer';

type WithChildrenConfig = {
    indent: CSSProperties['marginLeft'];
};

const defaultConfig: WithChildrenConfig = {
    indent: '30px',
};

const TreeView = forwardRef<
    HTMLDivElement,
    { lastItem?: boolean } & ComponentPropsWithRef<'div'>
>(({ lastItem, children, onClick, ...restProps }, ref) => {
    return (
        <div ref={ref} className={treeStyles('treeWrapper')} {...restProps}>
            <div className={treeStyles('treeView')}>
                <div
                    className={treeStyles({
                        line: true,
                        verticalLine: true,
                        lastItemVerticalLine: lastItem,
                    })}
                    onClick={onClick}
                />
                <div
                    className={treeStyles({
                        line: true,
                        horizontalLine: true,
                        lastItemHorizontalLine: lastItem,
                    })}
                    onClick={onClick}
                />
                {lastItem && <div className={treeStyles('lastItemRadius')} />}
            </div>
            {/* maybe need a child wrapper */}
            {children}
        </div>
    );
});

interface ChildrenViewProp {
    childrenIds: string[];
    handleCollapse: () => void;
    indent?: string | number;
}

const ChildrenView = ({
    childrenIds,
    handleCollapse,
    indent,
}: ChildrenViewProp) => {
    const [currentView] = useCurrentView();
    const isKanbanScene = currentView.type === SCENE_CONFIG.KANBAN;

    return (
        <div
            className={styles('children')}
            style={{ ...(!isKanbanScene && { marginLeft: indent }) }}
        >
            {childrenIds.map((childId, idx) => {
                if (isKanbanScene) {
                    return (
                        <StyledBorder>
                            <RenderBlock key={childId} blockId={childId} />
                        </StyledBorder>
                    );
                }

                return (
                    <TreeView
                        key={childId}
                        lastItem={idx === childrenIds.length - 1}
                        onClick={handleCollapse}
                    >
                        <RenderBlock key={childId} blockId={childId} />
                    </TreeView>
                );
            })}
        </div>
    );
};

const CollapsedNode = forwardRef<
    HTMLDivElement,
    ComponentPropsWithoutRef<'div'>
>((props, ref) => {
    return (
        <TreeView ref={ref} lastItem={true} {...props}>
            <div className={treeStyles('collapsed')} onClick={props.onClick}>
                ···
            </div>
        </TreeView>
    );
});

/**
 * Indent rendering child nodes
 */
export const withTreeViewChildren = (
    creator: (props: CreateView) => ReactElement,
    customConfig: Partial<WithChildrenConfig> = {}
) => {
    const config = {
        ...defaultConfig,
        ...customConfig,
    };

    return (props: CreateView) => {
        const { block, editor } = props;
        const collapsed = block.getProperty('collapsed')?.value;
        const childrenIds = block.childrenIds;
        const showChildren = !collapsed && childrenIds.length > 0;

        const [isSelect, setIsSelect] = useState<boolean>(false);
        useOnSelect(block.id, (isSelect: boolean) => {
            setIsSelect(isSelect);
        });
        const handleCollapse = () => {
            block.setProperty('collapsed', { value: true });
        };

        const handleExpand = () => {
            block.setProperty('collapsed', { value: false });
        };

        return (
            <BlockContainer
                editor={props.editor}
                block={block}
                selected={isSelect}
                className={styles('wrapper')}
            >
                <WrapperWithPendantAndDragDrop editor={editor} block={block}>
                    <div className={styles('node')}>{creator(props)}</div>
                </WrapperWithPendantAndDragDrop>

                {collapsed && (
                    <CollapsedNode
                        onClick={handleExpand}
                        style={{ marginLeft: config.indent }}
                    />
                )}
                {showChildren && (
                    <ChildrenView
                        childrenIds={childrenIds}
                        handleCollapse={handleCollapse}
                        indent={config.indent}
                    />
                )}
            </BlockContainer>
        );
    };
};

const styles = style9.create({
    wrapper: {
        display: 'flex',
        flexDirection: 'column',
    },
    node: {},

    children: {
        display: 'flex',
        flexDirection: 'column',
    },
});

const treeColor = '#D5DFE6';
// TODO determine the position of the horizontal line by the type of the item
const itemPointHeight = '12.5px'; // '50%'

const treeStyles = style9.create({
    treeWrapper: {
        position: 'relative',
    },

    treeView: {
        position: 'absolute',
        left: '-21px',
        height: '100%',
    },
    line: {
        position: 'absolute',
        cursor: 'pointer',
        backgroundColor: treeColor,
        boxSizing: 'content-box',
        // See [Can I add background color only for padding?](https://stackoverflow.com/questions/14628601/can-i-add-background-color-only-for-padding)
        backgroundClip: 'content-box',
        backgroundOrigin: 'content-box',
        // Increase click hot spot
        padding: '10px',
    },
    verticalLine: {
        width: '1px',
        height: '100%',
        paddingTop: 0,
        paddingBottom: 0,
        transform: 'translate(-50%, 0)',
    },
    horizontalLine: {
        width: '16px',
        height: '1px',
        paddingLeft: 0,
        paddingRight: 0,
        top: itemPointHeight,
        transform: 'translate(0, -50%)',
    },
    noItemHorizontalLine: {
        display: 'none',
    },

    lastItemHorizontalLine: {
        opacity: 0,
    },
    lastItemVerticalLine: {
        height: itemPointHeight,
        opacity: 0,
    },
    lastItemRadius: {
        boxSizing: 'content-box',
        position: 'absolute',
        left: '-0.5px',
        top: 0,
        height: itemPointHeight,
        bottom: '50%',
        width: '16px',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderLeftColor: treeColor,
        borderBottomColor: treeColor,
        borderTop: 'none',
        borderRight: 'none',
        borderRadius: '0 0 0 3px',
        pointerEvents: 'none',
    },

    collapsed: {
        cursor: 'pointer',
        display: 'inline-block',
        color: '#B9CAD5',
    },
});

const StyledBorder = styled('div')({
    border: '1px solid #E0E6EB',
    borderRadius: '5px',
    margin: '4px',
});
